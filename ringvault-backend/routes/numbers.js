import express from 'express';
import axios from 'axios';
import { supabaseAdmin, getUser } from '../lib/supabase.js';

const router = express.Router();

/**
 * Helper to transform data payload objects into application/x-www-form-urlencoded
 * queries required by SMSPool standard POST boundaries.
 */
const createFormData = (data) => {
  const params = new URLSearchParams();
  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null) {
      params.append(key, data[key]);
    }
  }
  return params;
};

// =========================================================================
// ENDPOINT 1: ALLOCATE A MOBILE VERIFICATION SIM LINE (WITH ACCURATE COCHING)
// =========================================================================
router.post('/buy-number', async (req, res) => {
  try {
    // 1. Authenticate user identity via incoming request context header hooks
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized access" });
    }

    const { service_name } = req.body; 
    if (!service_name) {
      return res.status(400).json({ success: false, error: "Target application service name is required." });
    }

    // 🌟 GUARDRAIL 1: Check your master SMSPool API balance BEFORE doing anything else
    try {
      const balanceCheckResponse = await axios.post(
        'https://api.smspool.net/request/balance',
        createFormData({ key: process.env.SMSPOOL_API_KEY }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const masterBalance = parseFloat(balanceCheckResponse.data.balance || "0");
      
      // If your SMSPool master balance is under $0.70 (typical high-end single verification ceiling)
      if (masterBalance < 0.70) {
        console.error(`🚨 RingVault Master Account Low Balance Warning: Current Balance is $${masterBalance}`);
        return res.status(503).json({ 
          success: false, 
          error: "Server maintenance in progress. System stock replenishment ongoing, please try again shortly." 
        });
      }
    } catch (balanceApiErr) {
      console.error("❌ Failed to verify external SMSPool health matrix:", balanceApiErr.message);
      return res.status(502).json({ success: false, error: "Gateway authentication check failed. Please try again." });
    }

    const RETAIL_PRICE = 2.00; // RingVault standard user wallet fallback pricing structure

    // 🌟 GUARDRAIL 2: Deduct user balance safely using database secure balance RPC trigger
    const { data: balanceCheck, error: balanceError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: RETAIL_PRICE,
      p_description: `Generated Verification Line for ${service_name}`
    });

    if (balanceError || !balanceCheck?.ok) {
      return res.status(402).json({ success: false, error: balanceCheck?.reason || "Insufficient RingVault wallet balance." });
    }

    try {
      // Step B: Send URL-encoded parameters to SMSPool secure endpoint
      const allocationPayload = {
        key: process.env.SMSPOOL_API_KEY,
        country: '1',  // Default baseline set to United States (US = '1')
        service: service_name.toLowerCase(),
        pricing_option: '0' // 0 optimizes system for the cheapest current stock available
      };

      const response = await axios.post(
        'https://api.smspool.net/purchase/sms', 
        createFormData(allocationPayload),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      // SMSPool validation criteria: checks numeric flag value or true boolean success
      if (response.data.success !== 1 && response.data.success !== true) {
        throw new Error(response.data.message || "Line allocation declined by vendor pool.");
      }

      const orderId = response.data.order_id;
      const assignedMobileNo = response.data.number;

      // Step C: Log active extraction sequence trace safely inside database layer
      const { error: dbInsertError } = await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id,
        phone_number: assignedMobileNo,
        telnyx_number_id: orderId.toString(), // Map SMSPool identity string smoothly into number ID column
        status: "active",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });

      if (dbInsertError) throw dbInsertError;

      // Send operational credentials directly back to your frontend wizard pages
      return res.status(200).json({ 
        success: true, 
        phone_number: assignedMobileNo,
        session_id: orderId 
      });

    } catch (apiError) {
      // Auto-Refund Agent: Restores wallet balance instantly if background vendor allocation fails
      await supabaseAdmin.rpc("credit_balance", { 
        p_user_id: user.id, 
        p_amount: RETAIL_PRICE 
      });
      
      console.error("❌ SMSPool Stock Allocation Failure:", apiError.response?.data || apiError.message);
      return res.status(502).json({ success: false, error: "Real mobile line out of stock. Wallet balance auto-refunded." });
    }
  } catch (globalServerException) {
    console.error("❌ Critical Internal Global Route Handler Error:", globalServerException.message);
    return res.status(500).json({ success: false, error: "Internal operational server tracking error." });
  }
});

// =========================================================================
// ENDPOINT 2: REAL-TIME POLLING LOOP AND DB LIVE HISTORICAL DATA SYNC
// =========================================================================
router.get('/check-otp/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    if (!session_id) {
      return res.status(400).json({ success: false, error: "Session tracking parameter reference required." });
    }

    const pollingPayload = {
      key: process.env.SMSPOOL_API_KEY,
      orderid: session_id
    };

    const response = await axios.post(
      'https://api.smspool.net/sms/check', 
      createFormData(pollingPayload),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // SMSPool status mappings: 1 = Pending, 3 = Completed/Success, 6 = Expired/Timed Out
    const smsPoolStatusFlag = response.data.status;
    let computedStatusString = 'Pending';
    
    if (smsPoolStatusFlag === 3) computedStatusString = 'Completed';
    if (smsPoolStatusFlag === 6) computedStatusString = 'Expired';

    const extractedCode = response.data.sms || null;
    const rawMessageBody = response.data.full_sms || response.data.sms || null;

    // Saves incoming OTP information into the database right when it hits SMSPool
    if (smsPoolStatusFlag === 3 && extractedCode) {
      await supabaseAdmin
        .from("user_numbers")
        .update({ 
          status: "completed",
          sms_code: extractedCode,       // Feeds history data layouts cleanly
          raw_sms_text: rawMessageBody  // Populates user inbox display layouts
        })
        .eq("telnyx_number_id", session_id.toString());
        
    } else if (smsPoolStatusFlag === 6) {
      // Mark as expired inside Supabase to prevent un-synchronized historical deadlocks
      await supabaseAdmin
        .from("user_numbers")
        .update({ status: "expired" })
        .eq("telnyx_number_id", session_id.toString());
    }

    // Pass structured, uniform clean response schemas directly back to the app frontend
    return res.status(200).json({
      success: true,
      status: computedStatusString, 
      otp_code: extractedCode, 
      full_sms: rawMessageBody
    });

  } catch (pollingException) {
    console.error("❌ SMSPool Verification Database Sync Error:", pollingException.response?.data || pollingException.message);
    return res.status(500).json({ success: false, error: "Failed to securely sync or fetch current verification code updates." });
  }
});

export default router;