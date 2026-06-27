import express from 'express';
import axios from 'axios';
import { supabaseAdmin, getUser } from '../lib/supabase.js';

const router = express.Router();

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
// NEW ENDPOINT: FETCH NUMBERS HISTORY (SHORT-TERM & LONG-TERM RENTALS)
// =========================================================================
router.get('/my-numbers', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized access" });
    }

    // 🌟 THE FIX: Fetching rows including both regular 'active' and multi-day 'rental_active' statuses
    const { data: numbers, error } = await supabaseAdmin
      .from('user_numbers')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'rental_active', 'completed', 'pending', 'expired'])
      .order('created_at', { ascending: false }); // Newest orders on top!

    if (error) {
      console.error("❌ Supabase fetch error inside /my-numbers:", error.message);
      throw error;
    }

    return res.status(200).json({ success: true, numbers: numbers || [] });
  } catch (err) {
    console.error("❌ Route Failure on /my-numbers:", err.message);
    return res.status(500).json({ success: false, error: "Failed to load your numbers history." });
  }
});

// =========================================================================
// ENDPOINT 1: SHORT-TERM ACTIVATIONS (DYNAMIC COST + $1.50 PROFIT MARGIN)
// =========================================================================
router.post('/buy-number', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized access" });

    const { service_name, state_code } = req.body; 
    if (!service_name) return res.status(400).json({ success: false, error: "Service name required." });

    const sanitizedService = service_name.toLowerCase();
    let targetCountryId = '1'; 
    let baseVendorCost = 0.50; 

    try {
      const ratesResponse = await axios.post(
        'https://api.smspool.net/request/success_rate',
        createFormData({ service: sanitizedService }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (Array.isArray(ratesResponse.data) && ratesResponse.data.length > 0) {
        const availablePools = ratesResponse.data.filter(item => parseFloat(item.low_price) > 0);
        if (availablePools.length > 0) {
          availablePools.sort((a, b) => parseFloat(a.low_price) - parseFloat(b.low_price));
          targetCountryId = availablePools[0].country_id.toString();
          baseVendorCost = parseFloat(availablePools[0].low_price);
        }
      }
    } catch (ratesErr) {
      console.warn("Pricing calculation fell back to baseline margins:", ratesErr.message);
    }

    if (state_code) {
      const dialMap = { "1": "1", "44": "2", "31": "3", "49": "8", "33": "17", "91": "22" };
      const cleanDialCode = state_code.toString().replace('+', '').trim();
      if (dialMap[cleanDialCode]) targetCountryId = dialMap[cleanDialCode];
    }

    const RETAIL_PRICE = baseVendorCost + 1.50;

    const { data: balanceCheck, error: balanceError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: RETAIL_PRICE,
      p_description: `Short-Term Verification for ${service_name} ($${RETAIL_PRICE.toFixed(2)})`
    });

    if (balanceError || !balanceCheck?.ok) {
      return res.status(402).json({ success: false, error: balanceCheck?.reason || "Insufficient RingVault wallet balance." });
    }

    try {
      const response = await axios.post(
        'https://api.smspool.net/purchase/sms', 
        createFormData({
          key: process.env.SMSPOOL_API_KEY,
          country: targetCountryId, 
          service: sanitizedService,
          pricing_option: '1' 
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data.success !== 1 && response.data.success !== true) throw new Error();

      const orderId = response.data.order_id;
      const assignedMobileNo = response.data.number;

      await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id, phone_number: assignedMobileNo, telnyx_number_id: orderId.toString(),
        status: "active", expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });

      return res.status(200).json({ success: true, phone_number: assignedMobileNo, session_id: orderId });
    } catch (apiError) {
      await supabaseAdmin.rpc("credit_balance", { p_user_id: user.id, p_amount: RETAIL_PRICE });
      return res.status(502).json({ success: false, error: "Mobile line out of stock. Wallet balance auto-refunded." });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal operational error." });
  }
});

// =========================================================================
// ENDPOINT 2: LONG-TERM RENTALS (DYNAMIC RENTAL COST + $1.50 PROFIT MARGIN)
// =========================================================================
router.post('/rent-number', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized access" });

    const { service_name, duration_days } = req.body;
    if (!service_name || !duration_days) {
      return res.status(400).json({ success: false, error: "Missing required service configuration variables." });
    }

    const days = parseInt(duration_days) || 1;
    let baseRentalCost = 2.50; 

    try {
      const pricingRes = await axios.post(
        'https://api.smspool.net/purchase/rental_price',
        createFormData({ key: process.env.SMSPOOL_API_KEY, service: service_name.toLowerCase(), duration: days }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      if (pricingRes.data.price) baseRentalCost = parseFloat(pricingRes.data.price);
    } catch (e) {
      console.warn("Could not load dynamic live rental prices:", e.message);
    }

    const TOTAL_RENTAL_RETAIL = baseRentalCost + 1.50;

    const { data: balanceCheck, error: balanceError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id, p_amount: TOTAL_RENTAL_RETAIL,
      p_description: `Long-Term ${days} Day Rental for ${service_name} ($${TOTAL_RENTAL_RETAIL.toFixed(2)})`
    });

    if (balanceError || !balanceCheck?.ok) {
      return res.status(402).json({ success: false, error: balanceCheck?.reason || "Insufficient balance for rental reservation." });
    }

    try {
      const response = await axios.post(
        'https://api.smspool.net/purchase/rental',
        createFormData({
          key: process.env.SMSPOOL_API_KEY,
          service: service_name.toLowerCase(),
          duration: days,
          country: '1' 
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (!response.data.success) throw new Error(response.data.message);

      const rentalId = response.data.rental_id;
      const rentalNumber = response.data.number;

      await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id, phone_number: rentalNumber, telnyx_number_id: rentalId.toString(),
        status: "rental_active", expires_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      });

      return res.status(200).json({ success: true, phone_number: rentalNumber, rental_id: rentalId, price_charged: TOTAL_RENTAL_RETAIL });
    } catch (err) {
      await supabaseAdmin.rpc("credit_balance", { p_user_id: user.id, p_amount: TOTAL_RENTAL_RETAIL });
      return res.status(502).json({ success: false, error: err.message || "Rental pool execution failure. Balanced reverted." });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal lease engine crash exception state." });
  }
});

// =========================================================================
// POLLING LOOP SYSTEM
// =========================================================================
router.get('/check-otp/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const response = await axios.post(
      'https://api.smspool.net/sms/check', 
      createFormData({ key: process.env.SMSPOOL_API_KEY, orderid: session_id }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const smsPoolStatusFlag = response.data.status;
    let computedStatusString = 'Pending';
    if (smsPoolStatusFlag === 3) computedStatusString = 'Completed';
    if (smsPoolStatusFlag === 6) computedStatusString = 'Expired';

    const extractedCode = response.data.sms || null;
    const rawMessageBody = response.data.full_sms || response.data.sms || null;

    if (smsPoolStatusFlag === 3 && extractedCode) {
      await supabaseAdmin.from("user_numbers").update({ 
        status: "completed", sms_code: extractedCode, raw_sms_text: rawMessageBody  
      }).eq("telnyx_number_id", session_id.toString());
    }

    return res.status(200).json({ success: true, status: computedStatusString, otp_code: extractedCode, full_sms: rawMessageBody });
  } catch (pollingException) {
    return res.status(500).json({ success: false, error: "Sync failure." });
  }
});

export default router;