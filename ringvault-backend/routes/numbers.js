import express from 'express';
import axios from 'axios';
import { supabaseAdmin, getUser } from '../lib/supabase.js';

const router = express.Router();

// Helper to convert objects to URLSearchParams format for SMSPool's content-type requirements
const createFormData = (data) => {
  const params = new URLSearchParams();
  for (const key in data) {
    params.append(key, data[key]);
  }
  return params;
};

// ==========================================
// ENDPOINT 1: BUY/EXTRACT A NUMBER FROM SMSPOOL
// ==========================================
router.post('/buy-number', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { service_name } = req.body; 
    if (!service_name) {
      return res.status(400).json({ success: false, error: "Target service name is required" });
    }

    const PRICE = 2.00; // Your RingVault consumer retail markup

    // Step A: Deduct user balance in Supabase securely via RPC
    const { data: result, error: dbError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: PRICE,
      p_description: `Requested Line for ${service_name}`
    });

    if (dbError || !result?.ok) {
      return res.status(402).json({ success: false, error: result?.reason || "Insufficient wallet balance." });
    }

    try {
      // Step B: Request SMSPool allocation (Using US country "1" as standard baseline)
      const purchaseData = {
        key: process.env.SMSPOOL_API_KEY,
        country: '1', 
        service: service_name.toLowerCase(),
        pricing_option: '0' // 0 handles cheapest available pool automatically
      };

      const response = await axios.post(
        'https://api.smspool.net/purchase/sms', 
        createFormData(purchaseData),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      // SMSPool returns { success: 1, number: "...", order_id: "...", ... }
      if (response.data.success !== 1 && response.data.success !== true) {
        throw new Error(response.data.message || "SMSPool stock allocation issue.");
      }

      const orderId = response.data.order_id;
      const phoneNumber = response.data.number;

      // Step C: Track verification line inside your database layer
      const { error: insertError } = await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id,
        phone_number: phoneNumber,
        telnyx_number_id: orderId.toString(), // Map SMSPool order_id perfectly into tracking column
        status: "active",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });

      if (insertError) throw insertError;

      return res.status(200).json({ 
        success: true, 
        phone_number: phoneNumber,
        session_id: orderId 
      });

    } catch (err) {
      // Automatic Fallback Agent: Instantly refund user if vendor extraction fails
      await supabaseAdmin.rpc("credit_balance", { 
        p_user_id: user.id, 
        p_amount: PRICE 
      });
      console.error("❌ SMSPool Allocation Failure:", err.response?.data || err.message);
      return res.status(502).json({ success: false, error: "Real mobile line out of stock. Wallet auto-refunded." });
    }
  } catch (globalError) {
    return res.status(500).json({ success: false, error: "Internal operational server error" });
  }
});

// ==========================================
// ENDPOINT 2: LIVE OTP STATUS POLLING Loop
// ==========================================
router.get('/check-otp/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    if (!session_id) {
      return res.status(400).json({ success: false, error: "Session identification tracking code required" });
    }

    const checkData = {
      key: process.env.SMSPOOL_API_KEY,
      orderid: session_id
    };

    const response = await axios.post(
      'https://api.smspool.net/sms/check', 
      createFormData(checkData),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // SMSPool status mappings: 1 = Pending, 3 = Completed/Success, 6 = Expired/Timed Out
    const smsPoolStatus = response.data.status;
    let statusString = 'Pending';
    if (smsPoolStatus === 3) statusString = 'Completed';
    if (smsPoolStatus === 6) statusString = 'Expired';

    return res.status(200).json({
      success: true,
      status: statusString, 
      otp_code: response.data.sms || null, // Holds the code once extracted
      full_sms: response.data.full_sms || response.data.sms || null
    });

  } catch (error) {
    console.error("❌ SMSPool Code Verification Polling Loop Failure:", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: "Failed to sync dynamic OTP records." });
  }
});

export default router;