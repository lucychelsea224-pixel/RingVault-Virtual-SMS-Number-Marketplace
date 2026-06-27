import express from 'express';
import axios from 'axios';
import { supabaseAdmin, getUser } from '../lib/supabase.js';

const router = express.Router();

// High-speed token cache to avoid spamming the Auth endpoint on every single poll request
let tokenCache = {
  token: null,
  expiresAt: 0
};

// Internal Agent Helper: Ensures we always have a valid, unexpired Bearer Token
async function getBearerToken() {
  const now = Date.now();
  // If we have a cached token valid for at least another 60 seconds, reuse it
  if (tokenCache.token && tokenCache.expiresAt > now + 60000) {
    return tokenCache.token;
  }

  try {
    const response = await axios.post('https://www.textverified.com/api/v2/Authentication', {}, {
      headers: {
        'X-API-KEY': process.env.TEXTVERIFIED_API_KEY
      }
    });
    
    // Textverified tokens typically last 1 hour. We cache it safely.
    tokenCache.token = response.data.token;
    tokenCache.expiresAt = now + 3000000; // 50 minutes safety margin
    return tokenCache.token;
  } catch (error) {
    console.error("❌ Textverified Authentication Gateway Failure:", error.response?.data || error.message);
    throw new Error("Textverified Authentication Failed.");
  }
}

// ==========================================
// ENDPOINT 1: BUY/EXTRACT A REAL MOBILE NUMBER
// ==========================================
router.post('/buy-number', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Expecting targets like 'whatsapp', 'telegram', 'google', 'instagram'
    const { service_name } = req.body; 
    if (!service_name) {
      return res.status(400).json({ success: false, error: "Target service name is required" });
    }

    const PRICE = 2.00; // Standard RingVault consumer retail pricing markup

    // Step A: Deduct user balance in Supabase securely via RPC
    const { data: result, error: dbError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: PRICE,
      p_description: `Requested Non-VoIP Line for ${service_name}`
    });

    if (dbError || !result?.ok) {
      return res.status(402).json({ success: false, error: result?.reason || "Insufficient wallet balance." });
    }

    try {
      // Step B: Connect to physical carrier SIM pools via Textverified
      const token = await getBearerToken();
      const sessionResponse = await axios.post('https://www.textverified.com/api/v2/Verifications', {
        service_name: service_name.toLowerCase(),
        requested_duration: '1d'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const { id, number } = sessionResponse.data;

      // Step C: Save verification line tracking session to user data layer
      const { error: insertError } = await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id,
        phone_number: number,
        telnyx_number_id: id.toString(), // Map Textverified session ID cleanly into your tracking structure
        status: "active",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15-minute standard expiration window for OTP completion
      });

      if (insertError) throw insertError;

      // Complete optimization feedback to frontend UI
      return res.status(200).json({ 
        success: true, 
        phone_number: number,
        session_id: id 
      });

    } catch (err) {
      // Automatic Fallback Agent: Instantly credit the user back if the carrier extraction fails
      await supabaseAdmin.rpc("credit_balance", { 
        p_user_id: user.id, 
        p_amount: PRICE 
      });
      console.error("❌ Textverified Mobile Extraction Error:", err.response?.data || err.message);
      return res.status(502).json({ success: false, error: "Real mobile line out of stock. Wallet automatically refunded." });
    }
  } catch (globalError) {
    return res.status(500).json({ success: false, error: "Internal operational server error" });
  }
});

// ==========================================
// ENDPOINT 2: LIVE OTP POLLING / CHECK STATUS
// ==========================================
router.get('/check-otp/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    if (!session_id) {
      return res.status(400).json({ success: false, error: "Session identification tracking code required" });
    }

    const token = await getBearerToken();

    // Query Textverified directly for this explicit number extraction stream
    const detailsResponse = await axios.get(`https://www.textverified.com/api/v2/Verifications/${session_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const { code, sms, status } = detailsResponse.data;

    // Status mapping response returned: 'Pending', 'Completed', or 'Expired'
    return res.status(200).json({
      success: true,
      status: status, 
      otp_code: code || null, // Delivers the raw extracted passcode once found
      full_sms: sms || null   // Full verification string block
    });

  } catch (error) {
    console.error("❌ Textverified OTP Check Loop Failure:", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: "Failed to sync OTP records." });
  }
});

export default router;