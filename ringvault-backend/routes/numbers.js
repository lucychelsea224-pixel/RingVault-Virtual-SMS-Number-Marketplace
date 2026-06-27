import express from 'express';
import axios from 'axios';
import { supabaseAdmin, getUser } from '../lib/supabase.js';

const router = express.Router();

// Helper function to handle Textverified's Bearer authentication flow
async function getBearerToken() {
  try {
    const response = await axios.post('https://www.textverified.com/api/v2/Authentication', {}, {
      headers: {
        'X-API-KEY': process.env.TEXTVERIFIED_API_KEY
      }
    });
    return response.data.token;
  } catch (error) {
    console.error("Textverified Auth Error:", error.response?.data || error.message);
    throw new Error("Failed authentication with Textverified.");
  }
}

// POST: Request a premium Non-VoIP mobile number for app activation
router.post('/buy-number', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Explicitly pass target app (e.g., 'whatsapp', 'telegram', 'google') from frontend
    const { service_name } = req.body; 
    if (!service_name) {
      return res.status(400).json({ success: false, error: "Target verification service name is required" });
    }

    const PRICE = 2.00; // Your markup marketplace item price

    // Deduct user balance in Supabase
    const { data: result, error: dbError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: PRICE,
      p_description: `Requested Non-VoIP Line for ${service_name}`
    });

    if (dbError || !result?.ok) {
      return res.status(402).json({ success: false, error: result?.reason || "Balance error" });
    }

    try {
      // 1. Grab fresh authorization token
      const token = await getBearerToken();

      // 2. Provision real mobile line from Textverified
      const sessionResponse = await axios.post('https://www.textverified.com/api/v2/Verifications', {
        service_name: service_name.toLowerCase(),
        requested_duration: '1d'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const { id, number, status } = sessionResponse.data;

      // 3. Insert tracking record into your user inventory table
      const { error: insertError } = await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id,
        phone_number: number,
        telnyx_number_id: id.toString(), // We map the session ID to your existing tracking column
        status: "active",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Usually 15 min expiration window for OTPs
      });

      if (insertError) throw insertError;

      return res.status(200).json({ 
        success: true, 
        phone_number: number,
        session_id: id 
      });

    } catch (err) {
      // Wallet failover rollback refund
      await supabaseAdmin.rpc("credit_balance", { 
        p_user_id: user.id, 
        p_amount: PRICE 
      });
      console.error("Textverified Line Booking Error:", err.response?.data || err.message);
      return res.status(502).json({ success: false, error: "Real mobile allocation failure. Wallet refunded." });
    }
  } catch (globalError) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET: Check session details / Pull incoming OTP code on demand
router.get('/check-otp/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    if (!session_id) {
      return res.status(400).json({ success: false, error: "Session tracking ID is required" });
    }

    const token = await getBearerToken();

    // Pull real-time details from Textverified using the session ID
    const detailsResponse = await axios.get(`https://www.textverified.com/api/v2/Verifications/${session_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const { code, sms, status } = detailsResponse.data;

    return res.status(200).json({
      success: true,
      status: status, // returns: 'Pending', 'Completed', or 'Expired'
      otp_code: code || null, // Extracts raw parsed code if delivered
      full_sms: sms || null  // Extracts full body message strings
    });

  } catch (error) {
    console.error("OTP Pull Error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;