import express from 'express';
import twilio from 'twilio';
import { supabaseAdmin, getUser } from '../lib/supabase.js';

const router = express.Router();

// Initialize Twilio client using your account credentials
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID, 
  process.env.TWILIO_AUTH_TOKEN
);

// GET: Search for available numbers from Twilio
router.get('/search-numbers', async (req, res) => {
  try {
    const { country_code } = req.query;
    
    if (!country_code) {
      return res.status(400).json({ success: false, error: "Country code is required" });
    }

    // Hit live Twilio phone line inventory
    const response = await twilioClient.availablePhoneNumbers(country_code.toUpperCase())
      .local
      .list({ limit: 10 });

    // Format the response array cleanly for your frontend mapping loop
    const formattedNumbers = response.map(num => ({
      phone_number: num.phoneNumber,
      country_code: country_code.toUpperCase(),
      cost: 2.00 // Keeping your marketplace markup price consistent
    }));

    return res.status(200).json({ success: true, numbers: formattedNumbers });
  } catch (error) {
    console.error("Twilio Search Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Buy a number via Twilio
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

    // Atomic Balance Deduction
    const { data: result, error: dbError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: PRICE,
      p_description: `Purchased ${phone_number}`
    });

    if (dbError || !result?.ok) {
      return res.status(402).json({ success: false, error: result?.reason || "Balance error" });
    }

    try {
      // Provision the line directly into your Twilio account
      const incomingNumber = await twilioClient.incomingPhoneNumbers.create({
        phoneNumber: phone_number,
        // Point SMS directly to your Render backend webhook route
        smsUrl: `https://${req.get('host')}/api/webhook` 
      });

      // Insert record into your Supabase database matching tracking IDs
      const { error: insertError } = await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id,
        phone_number: phone_number,
        telnyx_number_id: incomingNumber.sid, // Keep your table column name or match string
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
      console.error("Twilio provisioning failure:", err);
      return res.status(502).json({ success: false, error: "Twilio provision error. Wallet refunded." });
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

export default router;