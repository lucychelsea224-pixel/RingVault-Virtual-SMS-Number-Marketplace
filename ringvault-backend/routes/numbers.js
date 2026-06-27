import express from 'express';
import axios from 'axios';
import { supabaseAdmin, getUser } from '../lib/supabase.js';

const router = express.Router();

// 🌟 DIALING CODE TO SMSPOOL SYSTEM ID MAP
// Maps phone dialing codes (+1, +44, etc.) directly into SMSPool internal country variables
const COUNTRY_MAP = {
  "1": "1",    // USA / Canada (+1) -> SMSPool ID 1
  "44": "2",   // United Kingdom (+44) -> SMSPool ID 2
  "31": "3",   // Netherlands (+3荷兰) -> SMSPool ID 3
  "49": "8",   // Germany (+49) -> SMSPool ID 8
  "33": "17",  // France (+33) -> SMSPool ID 17
  "91": "22",  // India (+9 Indian code) -> SMSPool ID 22
};

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
// ENDPOINT 1: ALLOCATE LINE TRANSLATING STANDARD DIALING STATE CODES
// =========================================================================
router.post('/buy-number', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized access" });
    }

    // Frontend passes down service_name along with the dial state code (e.g. "1" or "44")
    const { service_name, state_code } = req.body; 
    if (!service_name) {
      return res.status(400).json({ success: false, error: "Target application service name is required." });
    }

    const sanitizedService = service_name.toLowerCase();
    
    // Clean string format if user included a '+' symbol
    const cleanDialCode = state_code ? state_code.toString().replace('+', '').trim() : '1';
    
    // Convert dial code into SMSPool's internal vendor ID (Falls back to '1' if unmatched)
    const targetCountryId = COUNTRY_MAP[cleanDialCode] || '1';

    // 🌟 GUARDRAIL 1: Pre-flight check on Master Account Balance
    try {
      const balanceCheckResponse = await axios.post(
        'https://api.smspool.net/request/balance',
        createFormData({ key: process.env.SMSPOOL_API_KEY }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const masterBalance = parseFloat(balanceCheckResponse.data.balance || "0");
      
      if (masterBalance < 0.70) {
        console.error(`🚨 RingVault Master Account Low Balance Warning: Current Balance is $${masterBalance}`);
        return res.status(503).json({ 
          success: false, 
          error: "Server maintenance in progress. Stock replenishment ongoing, please try again shortly." 
        });
      }
    } catch (balanceApiErr) {
      console.error("❌ Failed to verify external SMSPool wallet balance:", balanceApiErr.message);
      return res.status(502).json({ success: false, error: "Gateway authentication check failed. Please try again." });
    }

    const RETAIL_PRICE = 2.00; // Locked-in flat user fee

    // 🌟 GUARDRAIL 2: Secure local wallet balance deduction
    const { data: balanceCheck, error: balanceError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: RETAIL_PRICE,
      p_description: `Generated Verification Line for ${service_name} (Dial: +${cleanDialCode})`
    });

    if (balanceError || !balanceCheck?.ok) {
      return res.status(402).json({ success: false, error: balanceCheck?.reason || "Insufficient RingVault wallet balance." });
    }

    try {
      // Step B: Send converted country ID payload over to SMSPool
      const allocationPayload = {
        key: process.env.SMSPOOL_API_KEY,
        country: targetCountryId, 
        service: sanitizedService,
        pricing_option: '0' 
      };

      const response = await axios.post(
        'https://api.smspool.net/purchase/sms', 
        createFormData(allocationPayload),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data.success !== 1 && response.data.success !== true) {
        throw new Error(response.data.message || "Line allocation declined by vendor pool.");
      }

      const orderId = response.data.order_id;
      const assignedMobileNo = response.data.number;

      // Step C: Save tracking log state inside database layer
      const { error: dbInsertError } = await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id,
        phone_number: assignedMobileNo,
        telnyx_number_id: orderId.toString(),
        status: "active",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });

      if (dbInsertError) throw dbInsertError;

      return res.status(200).json({ 
        success: true, 
        phone_number: assignedMobileNo,
        session_id: orderId 
      });

    } catch (apiError) {
      // Fallback auto-refund matrix agent
      await supabaseAdmin.rpc("credit_balance", { 
        p_user_id: user.id, 
        p_amount: RETAIL_PRICE 
      });
      
      console.error("❌ SMSPool Stock Allocation Failure:", apiError.response?.data || apiError.message);
      return res.status(502).json({ success: false, error: "Real mobile line out of stock for this country code. Wallet balance auto-refunded." });
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

    const smsPoolStatusFlag = response.data.status;
    let computedStatusString = 'Pending';
    
    if (smsPoolStatusFlag === 3) computedStatusString = 'Completed';
    if (smsPoolStatusFlag === 6) computedStatusString = 'Expired';

    const extractedCode = response.data.sms || null;
    const rawMessageBody = response.data.full_sms || response.data.sms || null;

    if (smsPoolStatusFlag === 3 && extractedCode) {
      await supabaseAdmin
        .from("user_numbers")
        .update({ 
          status: "completed",
          sms_code: extractedCode,       
          raw_sms_text: rawMessageBody  
        })
        .eq("telnyx_number_id", session_id.toString());
        
    } else if (smsPoolStatusFlag === 6) {
      await supabaseAdmin
        .from("user_numbers")
        .update({ status: "expired" })
        .eq("telnyx_number_id", session_id.toString());
    }

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