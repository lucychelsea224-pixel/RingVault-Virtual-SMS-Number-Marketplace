import express from 'express';
import Sendchamp from 'sendchamp-sdk';
import { supabaseAdmin, getUser } from '../lib/supabase.js';

const router = express.Router();

// Initialize Sendchamp with your project token
const sendchamp = new Sendchamp({
  publicKey: process.env.SENDCHAMP_PUBLIC_KEY
});

// GET: Search for available virtual numbers from Sendchamp
router.get('/search-numbers', async (req, res) => {
  try {
    const { country_code } = req.query; // e.g. "US", "GB", "NG"
    
    if (!country_code) {
      return res.status(400).json({ success: false, error: "Country code is required" });
    }

    // Hit Sendchamp's available numbers pool
    const response = await sendchamp.getVirtualNumbers({
      country: country_code.toLowerCase(),
      limit: 10
    });

    if (!response || !response.data) {
      return res.status(200).json({ success: true, numbers: [] });
    }

    // Format output symmetrically for your frontend marketplace loop
    const formattedNumbers = response.data.map(num => ({
      phone_number: num.phone_number,
      country_code: country_code.toUpperCase(),
      cost: 2.00 // Your $2 standard marketplace item pricing 
    }));

    return res.status(200).json({ success: true, numbers: formattedNumbers });
  } catch (error) {
    console.error("Sendchamp Search Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Rent/Buy a virtual number via Sendchamp
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

    // Deduct user balance in Supabase
    const { data: result, error: dbError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: PRICE,
      p_description: `Purchased ${phone_number}`
    });

    if (dbError || !result?.ok) {
      return res.status(402).json({ success: false, error: result?.reason || "Balance error" });
    }

    try {
      // Allocate the phone line on Sendchamp and point webhooks to your backend
      const purchase = await sendchamp.purchaseVirtualNumber({
        phone_number: phone_number,
        webhook_url: `https://${req.get('host')}/api/webhook`
      });

      // Insert tracking record into your user inventory table
      const { error: insertError } = await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id,
        phone_number: phone_number,
        telnyx_number_id: purchase.data.id || "sendchamp_line", 
        status: "active",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (insertError) throw insertError;

      return res.status(200).json({ success: true });

    } catch (err) {
      // Automatic failover wallet refund
      await supabaseAdmin.rpc("credit_balance", { 
        p_user_id: user.id, 
        p_amount: PRICE 
      });
      console.error("Sendchamp booking error:", err);
      return res.status(502).json({ success: false, error: "Provider allocation error. Refunded." });
    }
  } catch (globalError) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET: Active numbers view
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

export default router;