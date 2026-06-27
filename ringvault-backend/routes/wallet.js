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
  } catch (err) { return res.status(500).json({ success: false }); }
});

router.post("/paystack-webhook", async (req, res) => {
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) return res.status(401).send("Invalid signature");

  const { event, data } = req.body;
  if (event === "charge.success") {
    const userId = data.metadata?.user_id;
    const usdAmount = parseFloat(data.metadata?.usd_amount);
    
    // Atomically credit user
    await supabaseAdmin.rpc("credit_balance", { p_user_id: userId, p_amount: usdAmount });
    await supabaseAdmin.from("transactions").insert({
      user_id: userId, type: "credit", amount: usdAmount,
      description: "Wallet top-up", paystack_reference: data.reference
    });
  }
  return res.sendStatus(200);
});

router.get("/balance", requireAuth, async (req, res) => {
  const { data } = await supabaseAdmin.from("profiles").select("balance").eq("id", req.user.id).single();
  return res.json({ success: true, balance: data?.balance || 0 });
});

export default router;