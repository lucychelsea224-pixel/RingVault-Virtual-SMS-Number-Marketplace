import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

router.get("/get-rate/:currency", requireAuth, async (req, res) => {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
    const data = await response.json();
    const rate = data.rates[req.params.currency.toUpperCase()];
    if (!rate) return res.status(400).json({ success: false, error: "Unsupported currency" });
    return res.json({ success: true, rate });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch exchange rate." });
  }
});

router.post("/paystack-webhook", async (req, res) => {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"])
    return res.status(401).send("Invalid signature");

  const { event, data } = req.body;
  if (event === "charge.success") {
    const userId = data.metadata?.user_id;
    const usdAmount = parseFloat(data.metadata?.usd_amount);

    const { error: insertError } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "credit",
      amount: usdAmount,
      description: "Wallet top-up",
      paystack_reference: data.reference,
    });

    if (insertError) {
      if (insertError.code !== "23505") {
        console.error("Webhook transaction insert failed:", insertError.message);
      }
      return res.sendStatus(200);
    }

    await supabaseAdmin.rpc("credit_balance", { p_user_id: userId, p_amount: usdAmount });
  }
  return res.sendStatus(200);
});

router.get("/balance", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("balance")
      .eq("id", req.user.id)
      .single();
    if (error) throw error;
    return res.json({ success: true, balance: data?.balance || 0 });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch balance." });
  }
});

router.get("/transactions", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return res.json({ success: true, transactions: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to load transactions." });
  }
});

router.post("/verify-payment", requireAuth, async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ success: false, message: "Missing payment reference." });
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return res.status(400).json({ success: false, message: "Payment could not be verified." });
    }

    const tx = verifyData.data;

    if (tx.metadata?.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Reference does not belong to this account." });
    }

    const usdAmount = parseFloat(tx.metadata?.usd_amount);
    if (!usdAmount || usdAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount on record." });
    }

    const { error: insertError } = await supabaseAdmin.from("transactions").insert({
      user_id: req.user.id,
      type: "credit",
      amount: usdAmount,
      description: "Wallet top-up",
      paystack_reference: reference,
    });

    let balance;
    if (insertError) {
      if (insertError.code !== "23505") {
        console.error("verify-payment insert failed:", insertError.message);
        return res.status(500).json({ success: false, message: "Could not record transaction." });
      }
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("balance")
        .eq("id", req.user.id)
        .single();
      balance = data?.balance || 0;
    } else {
      const { data: rpcData } = await supabaseAdmin.rpc("credit_balance", {
        p_user_id: req.user.id,
        p_amount: usdAmount,
      });
      balance = rpcData?.balance_after ?? null;
    }

    return res.json({ success: true, balance });
  } catch (err) {
    console.error("verify-payment error:", err.message || err);
    return res.status(500).json({ success: false, message: "Server error verifying transaction." });
  }
});

router.post("/init-topup", requireAuth, async (req, res) => {
  return res.status(400).json({
    success: false,
    message: "init-topup is deprecated. Use POST /api/wallet/verify-payment instead.",
  });
});

export default router;
