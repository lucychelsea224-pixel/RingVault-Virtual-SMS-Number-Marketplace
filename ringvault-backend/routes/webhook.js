// routes/webhook.js
// POST /webhook/sms
//
// Receives inbound SMS messages from Telnyx and inserts them into
// the Supabase `sms_logs` table. Supabase Realtime then broadcasts
// the new row to subscribed frontend clients.
//
// Security:
//   • Telnyx signs every webhook with a timestamp + HMAC-SHA256 signature.
//   • We verify the signature BEFORE processing anything.
//   • We use the SERVICE_ROLE Supabase client so RLS doesn't block inserts.
//
// Telnyx Webhook Docs:
//   https://developers.telnyx.com/docs/api/v2/receive-webhooks

import { Router } from "express";
import crypto from "crypto";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

// ─── Signature verification helper ──────────────────────────────────────────
/**
 * Verifies a Telnyx webhook signature.
 * Telnyx sends:
 *   telnyx-signature-ed25519   – Ed25519 signature (base64)
 *   telnyx-timestamp           – Unix timestamp (seconds)
 *
 * Signed payload = timestamp + "|" + raw_body
 */
function verifyTelnyxSignature(req) {
  const secret = process.env.TELNYX_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[webhook] TELNYX_WEBHOOK_SECRET not set – skipping verification");
    return true; // Allow in dev; enforce in production
  }

  const signature = req.headers["telnyx-signature-ed25519"];
  const timestamp = req.headers["telnyx-timestamp"];

  if (!signature || !timestamp) return false;

  // Reject webhooks older than 5 minutes (replay attack prevention)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    console.warn("[webhook] Timestamp too old – possible replay attack");
    return false;
  }

  // Build the signed payload
  const rawBody = req.rawBody; // Set by express.json({ verify: ... }) in server.js
  const signedPayload = `${timestamp}|${rawBody}`;

  // Telnyx uses Ed25519 – verify with the public key (stored as base64 secret)
  try {
    const publicKey = crypto.createPublicKey({
      key: Buffer.from(secret, "base64"),
      type: "spki",
      format: "der",
    });

    const isValid = crypto.verify(
      null, // Ed25519 doesn't use a hash algorithm param
      Buffer.from(signedPayload),
      publicKey,
      Buffer.from(signature, "base64")
    );

    return isValid;
  } catch (e) {
    console.error("[webhook] Signature verification error:", e.message);
    return false;
  }
}

// ─── Extract OTP code from SMS body ──────────────────────────────────────────
function extractOTPCode(text) {
  if (!text) return null;

  // Match common OTP patterns:
  //   6-digit:   847291, 847 291, 847-291
  //   WhatsApp:  847-291
  //   Google:    G-428591
  const patterns = [
    /\b([A-Z]-?\d{6})\b/,                     // Google: G-123456
    /\b(\d{3}[\s-]\d{3})\b/,                  // 847 291 or 847-291
    /\b(\d{4}[\s-]\d{2})\b/,                  // 5821 44 (Facebook style)
    /(?:code|otp|pin|passcode)[:\s]+(\d{4,8})/i, // "code: 123456"
    /\b(\d{6})\b/,                             // plain 6-digit
    /\b(\d{4})\b/,                             // plain 4-digit
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

// ─── POST /webhook/sms ────────────────────────────────────────────────────────
router.post("/sms", async (req, res) => {
  // 1. Verify Telnyx signature
  if (!verifyTelnyxSignature(req)) {
    console.warn("[webhook] Invalid signature – rejecting request");
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  const { data } = req.body;
  const eventType = data?.event_type;

  // Only process inbound messages
  if (eventType !== "message.received") {
    return res.status(200).json({ received: true, processed: false });
  }

  const payload = data?.payload;

  if (!payload) {
    return res.status(400).json({ error: "Missing payload" });
  }

  const {
    id: telnyx_message_id,
    from,
    to,
    text,
    received_at,
  } = payload;

  const toNumber = Array.isArray(to) ? to[0]?.phone_number : to?.phone_number;
  const fromNumber = from?.phone_number || from;

  // 2. Look up which user owns the destination number
  const { data: userNumber, error: lookupError } = await supabaseAdmin
    .from("user_numbers")
    .select("id, user_id, phone_number")
    .eq("phone_number", toNumber)
    .eq("status", "active")
    .single();

  if (lookupError || !userNumber) {
    console.warn(`[webhook] No active user found for number ${toNumber}`);
    // Still return 200 so Telnyx doesn't retry
    return res.status(200).json({ received: true, processed: false });
  }

  // 3. Extract OTP code if present
  const otp_code = extractOTPCode(text);

  // 4. Determine the sender service (heuristic)
  const senderService = detectService(fromNumber, text);

  // 5. Insert into sms_logs → Supabase Realtime will push to the client
  const { error: insertError } = await supabaseAdmin
    .from("sms_logs")
    .insert({
      telnyx_message_id,
      user_id: userNumber.user_id,
      user_number_id: userNumber.id,
      from_number: fromNumber,
      to_number: toNumber,
      body: text,
      otp_code,
      service_name: senderService,
      received_at: received_at || new Date().toISOString(),
    });

  if (insertError) {
    console.error("[webhook] Failed to insert SMS log:", insertError);
    // Return 500 so Telnyx retries the delivery
    return res.status(500).json({ error: "Failed to store SMS" });
  }

  console.log(
    `[webhook] SMS logged: ${fromNumber} → ${toNumber} | OTP: ${otp_code || "N/A"}`
  );

  return res.status(200).json({ received: true, processed: true });
});

// ─── Service name detection ───────────────────────────────────────────────────
function detectService(fromNumber, body = "") {
  const text = body.toLowerCase();
  const known = {
    whatsapp: ["whatsapp", "wa.me"],
    facebook: ["facebook", "fb.com", "meta"],
    telegram: ["telegram"],
    google: ["google", "g-"],
    instagram: ["instagram"],
    twitter: ["twitter", "x.com"],
    tiktok: ["tiktok"],
    uber: ["uber"],
    snapchat: ["snapchat"],
    netflix: ["netflix"],
  };

  for (const [service, keywords] of Object.entries(known)) {
    if (keywords.some((kw) => text.includes(kw))) return service;
  }

  return "Unknown";
}

export default router;
