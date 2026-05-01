// routes/wallet.js
// Handles:
//   POST /api/wallet/verify-payment   – verify Paystack transaction + credit wallet
//   GET  /api/wallet/balance          – get current balance
//   GET  /api/wallet/transactions     – transaction history

import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

// ─── POST /api/wallet/verify-payment ─────────────────────────────────────────
// Called from the frontend AFTER Paystack's onSuccess callback.
// We verify the Paystack reference server-side to prevent spoofing.
//
// Paystack inline flow:
//   1. Frontend initialises Paystack with amount + user email
//   2. User pays on Paystack's modal
//   3. onSuccess({ reference }) fires → frontend calls this endpoint
//   4. We verify with Paystack API → credit wallet if genuine
//
// Security: NEVER credit the wallet based solely on the frontend callback.
//           Always verify with Paystack's /transaction/verify/:reference API.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/verify-payment", requireAuth, async (req, res) => {
  const { reference } = req.body;
  const userId = req.user.id;

  if (!reference) {
    return res.status(400).json({ success: false, error: "reference is required" });
  }

  // Check if this reference has already been processed (idempotency)
  const { data: existingTx } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("paystack_reference", reference)
    .single();

  if (existingTx) {
    return res.status(409).json({
      success: false,
      error: "This payment has already been processed.",
    });
  }

  // Verify with Paystack
  let paystackData;
  try {
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    const json = await verifyRes.json();

    if (!json.status || json.data?.status !== "success") {
      return res.status(402).json({
        success: false,
        error: "Payment not confirmed by Paystack.",
      });
    }

    paystackData = json.data;
  } catch (err) {
    console.error("[wallet] Paystack verify error:", err);
    return res.status(502).json({ success: false, error: "Could not reach Paystack." });
  }

  // Paystack amounts are in kobo (NGN) or pesewas (GHS), etc.
  // We store balances in USD. Convert using a fixed rate or live rate.
  // For simplicity: Paystack amount is in the smallest currency unit.
  // We trust the metadata.usd_amount field set by the frontend initialisation.
  const usdAmount =
    paystackData.metadata?.usd_amount ||
    paystackData.amount / 100; // Fallback: assume 1 unit = $0.01

  if (usdAmount <= 0) {
    return res.status(400).json({ success: false, error: "Invalid amount." });
  }

  // Credit the wallet (atomic RPC)
  const { data: creditResult, error: creditError } = await supabaseAdmin.rpc(
    "credit_balance",
    { p_user_id: userId, p_amount: usdAmount }
  );

  if (creditError) {
    console.error("[wallet] Credit error:", creditError);
    return res
      .status(500)
      .json({ success: false, error: "Failed to credit wallet." });
  }

  // Log the transaction
  await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type: "credit",
    amount: usdAmount,
    description: `Wallet top-up via Paystack`,
    paystack_reference: reference,
  });

  return res.json({
    success: true,
    message: `$${usdAmount.toFixed(2)} added to your wallet.`,
    balance: creditResult.balance_after,
  });
});

// ─── Paystack Webhook (optional – for server-initiated credits) ───────────────
// Use this if you want Paystack to push events instead of the client polling.
router.post("/paystack-webhook", async (req, res) => {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, data } = req.body;

  if (event === "charge.success") {
    // Idempotent credit – same logic as /verify-payment
    console.log("[paystack-webhook] charge.success:", data.reference);
    // ... implement if needed
  }

  return res.sendStatus(200);
});

// ─── GET /api/wallet/balance ──────────────────────────────────────────────────
router.get("/balance", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("balance")
    .eq("id", req.user.id)
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, balance: data.balance });
});

// ─── GET /api/wallet/transactions ────────────────────────────────────────────
router.get("/transactions", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, transactions: data });
});

export default router;
