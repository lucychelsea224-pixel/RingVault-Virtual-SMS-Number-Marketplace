import express from 'express';
import Telnyx from 'telnyx';
import { supabaseAdmin, getUser } from '../lib/supabase.js';

const router = express.Router();
const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

// GET: Search for available numbers
router.get('/search-numbers', async (req, res) => {
  try {
    const { country_code, administrative_area } = req.query;
    // Your Telnyx searching logic goes here...
    return res.status(200).json({ success: true, numbers: [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Buy a number
router.post('/buy-number', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { phone_number } = req.body;
    if (!phone_number) {
      return res.status(400).json({ success: false, error: "Phone number is required" });
    }

    const PRICE = 2.0;

    // Atomic Deduction via SQL RPC
    const { data: result, error: dbError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: PRICE,
      p_description: `Purchased ${phone_number}`
    });

    if (dbError || !result?.ok) {
      return res.status(402).json({ success: false, error: result?.reason || "Balance error" });
    }

    try {
      const order = await telnyx.numberOrders.create({
        phone_numbers: [{ phone_number }],
        messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID,
      });

      const { error: insertError } = await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id,
        phone_number: phone_number,
        telnyx_number_id: order.data.phone_numbers[0].id,
        status: "active",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (insertError) throw insertError;

      return res.status(200).json({ success: true });

    } catch (err) {
      // Refund Wallet on API Failures
      await supabaseAdmin.rpc("credit_balance", { 
        p_user_id: user.id, 
        p_amount: PRICE 
      });
      return res.status(502).json({ success: false, error: "Telnyx error. Refunded." });
    }
  } catch (globalError) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET: Get user active numbers
router.get('/my-numbers', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });

    const { data, error } = await supabaseAdmin
      .from("user_numbers")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) throw error;
    return res.status(200).json({ success: true, numbers: data || [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Release a number
router.post('/release-number', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });

    const { phone_number } = req.body;
    // Your release functionality logic here...
    return res.status(200).json({ success: true, message: "Number released" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;