import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

// 1. WEBHOOK: SOURCE OF TRUTH
router.post("/paystack-webhook", async (req, res) => {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.rawBody) // Securely using the raw buffer
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, data } = req.body;

  if (event === "charge.success") {
    const reference = data.reference;
    const userId = data.metadata?.user_id;

    // Check if already processed to prevent double-spending
    const { data: existingTx } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (!existingTx && userId) {
      const usdAmount = data.metadata?.usd_amount || (data.amount / 100);

      // Perform credit and log transaction atomically
      await supabaseAdmin.rpc("credit_balance", { p_user_id: userId, p_amount: usdAmount });
      
      await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        type: "credit",
        amount: usdAmount,
        description: "Wallet top-up via Paystack",
        paystack_reference: reference,
      });
    }
  }
  return res.sendStatus(200);
});

// 2. VERIFY-PAYMENT: Frontend triggers this to redirect the user
router.post("/verify-payment", requireAuth, async (req, res) => {
  const { reference } = req.body;
  
  // Just check if it exists in the DB (since the Webhook already processed it)
  const { data: tx } = await supabaseAdmin
    .from("transactions")
    .select("amount")
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (tx) {
    return res.json({ success: true, message: "Payment verified successfully." });
  }

  // If not in DB yet, try one manual verification check
  return res.status(202).json({ success: false, error: "Payment processing, please wait..." });
});

// GET /api/wallet/balance
router.get("/balance", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("balance")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, balance: data.balance || 0 });
});

export default router;