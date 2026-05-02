// routes/numbers.js
// Handles:
//   GET  /api/search-numbers  – query Telnyx for available numbers
//   POST /api/buy-number      – purchase a number, deduct balance (atomic)
//   GET  /api/my-numbers      – list numbers owned by the authenticated user

import { Router } from "express";
import Telnyx from "telnyx";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();
const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

// ─── Constants ───────────────────────────────────────────────────────────────
const NUMBER_PRICE_USD = 2.0; // Fixed price per number

// ─── GET /api/search-numbers ─────────────────────────────────────────────────
// Query params:
//   country_code         e.g. "US"
//   administrative_area  e.g. "California"  (optional)
//   limit                default 20, max 50
//
// Uses Telnyx availablePhoneNumbers API with features=[SMS]
// Docs: https://developers.telnyx.com/docs/numbers/search
// ─────────────────────────────────────────────────────────────────────────────
router.get("/search-numbers", requireAuth, async (req, res) => {
  const {
    country_code = "US",
    administrative_area = "",
    limit = 20,
  } = req.query;

  if (!country_code) {
    return res
      .status(400)
      .json({ success: false, error: "country_code is required" });
  }

  try {
    const params = {
      filter: {
        country_code: country_code.toUpperCase(),
        features: ["sms"],         // Only return SMS-capable numbers
        limit: Math.min(+limit, 50),
        best_effort: true,         // <--- FIX: Prevents 10031 error
      },
    };

    // Add state/region filter when provided
    // ⚠️ COMMENTED OUT TO BYPASS TELNYX STRICT ABBREVIATION RULES FOR NOW
    // if (administrative_area) {
    //   params.filter.administrative_area = administrative_area;
    // }

    const response = await telnyx.availablePhoneNumbers.list(params);

    const numbers = (response.data || []).map((n) => ({
      phone_number: n.phone_number,
      region: n.administrative_area || "Unknown",
      country_code: n.country_code,
      // 🐛 THE FIX: Extract the feature name string from the object so React doesn't crash
      features: n.features ? n.features.map(f => typeof f === 'object' ? f.name : f) : ["SMS"],
      price_usd: NUMBER_PRICE_USD,
      monthly_cost: n.cost?.monthly_cost?.amount || "2.00",
    }));

    return res.json({ success: true, count: numbers.length, numbers });
  } catch (err) {
    console.error("[search-numbers] Telnyx error:", err);
    return res.status(502).json({
      success: false,
      error: "Failed to fetch numbers from Telnyx.",
      detail: err.message,
    });
  }
});

// ─── POST /api/buy-number ─────────────────────────────────────────────────────
router.post("/buy-number", requireAuth, async (req, res) => {
  const { phone_number } = req.body;
  const userId = req.user.id;

  if (!phone_number) {
    return res
      .status(400)
      .json({ success: false, error: "phone_number is required" });
  }

  const { data: deductResult, error: deductError } = await supabaseAdmin.rpc(
    "deduct_balance",
    {
      p_user_id: userId,
      p_amount: NUMBER_PRICE_USD,
    }
  );

  if (deductError) {
    console.error("[buy-number] Balance deduction error:", deductError);
    return res.status(500).json({
      success: false,
      error: "Failed to process balance. Please try again.",
    });
  }

  if (!deductResult?.ok) {
    return res.status(402).json({
      success: false,
      error: deductResult?.reason || "Insufficient balance.",
      balance: deductResult?.balance_after,
    });
  }

  let telnyxOrder;
  try {
    telnyxOrder = await telnyx.numberOrders.create({
      phone_numbers: [{ phone_number }],
      // THE FIX: Pass the messaging profile ID instead of the connection ID
      messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID,
    });
  } catch (telnyxErr) {
    console.error("[buy-number] Telnyx order error:", telnyxErr);

    await supabaseAdmin.rpc("credit_balance", {
      p_user_id: userId,
      p_amount: NUMBER_PRICE_USD,
    });

    return res.status(502).json({
      success: false,
      error: "Failed to order number from Telnyx. Your balance has been refunded.",
      detail: telnyxErr.message,
    });
  }

  const orderedNumber = telnyxOrder.data?.phone_numbers?.[0];

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { data: userNumber, error: insertError } = await supabaseAdmin
    .from("user_numbers")
    .insert({
      user_id: userId,
      phone_number: orderedNumber?.phone_number || phone_number,
      telnyx_number_id: orderedNumber?.id,
      status: "active",
      expires_at: expiresAt.toISOString(),
      monthly_cost: NUMBER_PRICE_USD,
    })
    .select()
    .single();

  if (insertError) {
    console.error("[buy-number] DB insert error:", insertError);
  }

  await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type: "debit",
    amount: NUMBER_PRICE_USD,
    description: `Purchased number ${phone_number}`,
    reference: telnyxOrder.data?.id,
  });

  return res.json({
    success: true,
    message: "Number purchased successfully!",
    number: userNumber,
    balance_after: deductResult.balance_after,
  });
});

// ─── GET /api/my-numbers ─────────────────────────────────────────────────────
router.get("/my-numbers", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("user_numbers")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, numbers: data });
});

// ─── DELETE /api/release-number/:id ──────────────────────────────────────────
router.delete("/release-number/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: num, error: findErr } = await supabaseAdmin
    .from("user_numbers")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (findErr || !num) {
    return res.status(404).json({ success: false, error: "Number not found." });
  }

  try {
    if (num.telnyx_number_id) {
      await telnyx.phoneNumbers.delete(num.phone_number);
    }
  } catch (e) {
    console.warn("[release-number] Telnyx delete failed:", e.message);
  }

  await supabaseAdmin
    .from("user_numbers")
    .update({ status: "released", released_at: new Date().toISOString() })
    .eq("id", id);

  return res.json({ success: true, message: "Number released." });
});

export default router;