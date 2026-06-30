import express from 'express';
import axios from 'axios';
import { supabaseAdmin, getUser } from '../lib/supabase.js';
import { getSmsPoolCountryMap } from '../lib/smspool-countries.js';

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

async function resolveCountryId(stateCode) {
  if (!stateCode || stateCode === 'virtual') return '1';
  try {
    const map = await getSmsPoolCountryMap();
    const cleanDialCode = stateCode.toString().replace('+', '').trim();
    return map[cleanDialCode] || '1';
  } catch (err) {
    console.error('Failed to resolve SMSPool country map, defaulting to US:', err.message);
    return '1';
  }
}

router.get('/my-numbers', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized access" });

    const { data: numbers, error } = await supabaseAdmin
      .from('user_numbers')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'rental_active', 'completed', 'pending', 'expired', 'refunded'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, numbers: numbers || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to load numbers history." });
  }
});

router.post('/buy-number', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized access" });

    const { service_name, state_code } = req.body;
    if (!service_name) return res.status(400).json({ success: false, error: "Service name required." });

    const sanitizedService = service_name.toLowerCase();
    const targetCountryId = await resolveCountryId(state_code);
    const baseVendorCost = 0.50;
    const RETAIL_PRICE = baseVendorCost + 1.50;

    const { data: balanceCheck, error: balanceError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: RETAIL_PRICE,
      p_description: `Short-Term Verification for ${service_name}`
    });

    if (balanceError || !balanceCheck || balanceCheck.ok === false) {
      return res.status(402).json({ success: false, error: "Insufficient RingVault wallet balance to proceed." });
    }

    try {
      const response = await axios.post(
        'https://api.smspool.net/purchase/sms',
        createFormData({ key: process.env.SMSPOOL_API_KEY, country: targetCountryId, service: sanitizedService, pricing_option: '1' }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data.success !== 1 && response.data.success !== true) throw new Error("SMSPool rejected the request");

      const { data: insertedRow, error: insertErr } = await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id,
        phone_number: response.data.number,
        telnyx_number_id: response.data.order_id.toString(),
        country_code: state_code || "1",
        status: "active",
        amount_paid: RETAIL_PRICE,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }).select().single();

      if (insertErr) throw insertErr;

      return res.status(200).json({
        success: true,
        phone_number: response.data.number,
        session_id: response.data.order_id,
        number_id: insertedRow.id
      });
    } catch (apiError) {
      await supabaseAdmin.rpc("credit_balance", { p_user_id: user.id, p_amount: RETAIL_PRICE });
      return res.status(502).json({ success: false, error: "Carrier pool dry. Wallet auto-refunded." });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal purchase error." });
  }
});

router.post('/rent-number', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized access" });

    const { service_name, duration_days, state_code } = req.body;
    const days = parseInt(duration_days) || 1;
    const TOTAL_RENTAL_RETAIL = 4.00;
    const targetCountryId = await resolveCountryId(state_code);

    const { data: balanceCheck, error: balanceError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: TOTAL_RENTAL_RETAIL,
      p_description: `Rental ${service_name}`
    });

    if (balanceError || !balanceCheck || balanceCheck.ok === false) {
      return res.status(402).json({ success: false, error: "Insufficient wallet balance." });
    }

    try {
      const response = await axios.post(
        'https://api.smspool.net/purchase/rental',
        createFormData({ key: process.env.SMSPOOL_API_KEY, service: service_name.toLowerCase(), duration: days, country: targetCountryId }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (!response.data.success) throw new Error("SMSPool rental rejected");

      const { data: insertedRow, error: insertErr } = await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id,
        phone_number: response.data.number,
        telnyx_number_id: response.data.rental_id.toString(),
        country_code: state_code || "1",
        status: "rental_active",
        amount_paid: TOTAL_RENTAL_RETAIL,
        expires_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      }).select().single();

      if (insertErr) throw insertErr;

      return res.status(200).json({
        success: true,
        phone_number: response.data.number,
        number_id: insertedRow.id
      });
    } catch (err) {
      await supabaseAdmin.rpc("credit_balance", { p_user_id: user.id, p_amount: TOTAL_RENTAL_RETAIL });
      return res.status(502).json({ success: false, error: "Rental pool failure. Wallet auto-refunded." });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: "System error." });
  }
});

router.post('/resend-code', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized access" });

    const { number_id } = req.body;
    if (!number_id) return res.status(400).json({ success: false, error: "number_id is required." });

    const { data: numberRow, error: numErr } = await supabaseAdmin
      .from('user_numbers')
      .select('*')
      .eq('id', number_id)
      .eq('user_id', user.id)
      .single();

    if (numErr || !numberRow) {
      return res.status(404).json({ success: false, error: "Number not found on your account." });
    }
    if (!['active', 'rental_active'].includes(numberRow.status)) {
      return res.status(400).json({ success: false, error: "This number is no longer active, so a resend can't be requested." });
    }

    const RESEND_FEE = 0.75;

    const { data: balanceCheck, error: balanceError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: RESEND_FEE,
      p_description: `Resend code for ${numberRow.phone_number}`
    });

    if (balanceError || !balanceCheck || balanceCheck.ok === false) {
      return res.status(402).json({ success: false, error: "Insufficient RingVault wallet balance to request a resend." });
    }

    try {
      const response = await axios.post(
        'https://api.smspool.net/sms/resend',
        createFormData({ key: process.env.SMSPOOL_API_KEY, orderid: numberRow.telnyx_number_id }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data.success !== 1 && response.data.success !== true) throw new Error();

      return res.status(200).json({
        success: true,
        session_id: numberRow.telnyx_number_id,
        message: "Resend requested — watch your inbox for the new code."
      });
    } catch (apiError) {
      await supabaseAdmin.rpc("credit_balance", { p_user_id: user.id, p_amount: RESEND_FEE });
      return res.status(502).json({ success: false, error: "Resend request failed upstream. Wallet auto-refunded." });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal resend error." });
  }
});

router.post('/request-refund', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized access" });

    const { number_id } = req.body;
    if (!number_id) return res.status(400).json({ success: false, error: "number_id is required." });

    const { data: numberRow, error: numErr } = await supabaseAdmin
      .from('user_numbers')
      .select('*')
      .eq('id', number_id)
      .eq('user_id', user.id)
      .single();

    if (numErr || !numberRow) {
      return res.status(404).json({ success: false, error: "Number not found on your account." });
    }

    if (numberRow.sms_code) {
      return res.status(400).json({
        success: false,
        error: "This number already received its verification code, so it isn't eligible for a refund."
      });
    }

    if (!['active', 'rental_active'].includes(numberRow.status)) {
      return res.status(400).json({ success: false, error: "This number is no longer eligible for a refund." });
    }

    try {
      const response = await axios.post(
        'https://api.smspool.net/sms/cancel',
        createFormData({ key: process.env.SMSPOOL_API_KEY, orderid: numberRow.telnyx_number_id }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const smspoolConfirmedRefund = response.data.success === 1 || response.data.success === true;

      if (!smspoolConfirmedRefund) {
        return res.status(400).json({
          success: false,
          error: response.data.message || "SMSPool declined the refund — the number may already be in use."
        });
      }

      const refundAmount = numberRow.amount_paid || (numberRow.status === 'rental_active' ? 4.00 : 2.00);

      await supabaseAdmin.rpc("credit_balance", { p_user_id: user.id, p_amount: refundAmount });

      await supabaseAdmin
        .from('user_numbers')
        .update({ status: 'refunded' })
        .eq('id', number_id);

      return res.status(200).json({
        success: true,
        message: `Refunded $${refundAmount.toFixed(2)} to your wallet.`,
        refunded_amount: refundAmount
      });
    } catch (apiError) {
      return res.status(502).json({ success: false, error: "Could not reach SMSPool to process the refund. Try again shortly." });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal refund error." });
  }
});

router.get('/check-otp/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const response = await axios.post(
      'https://api.smspool.net/sms/check',
      createFormData({ key: process.env.SMSPOOL_API_KEY, orderid: session_id }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const smsPoolStatusFlag = response.data.status;
    const extractedCode = response.data.sms || null;
    const rawMessageBody = response.data.full_sms || response.data.sms || null;

    if (smsPoolStatusFlag === 3 && extractedCode) {
      const { data: updatedNumbers } = await supabaseAdmin
        .from("user_numbers")
        .update({ status: "completed", sms_code: extractedCode, raw_sms_text: rawMessageBody })
        .eq("telnyx_number_id", session_id.toString())
        .select();

      if (updatedNumbers?.[0]) {
        await supabaseAdmin.from("messages").insert({
          user_id: updatedNumbers[0].user_id,
          sender: "Verification OTP",
          phone_number: updatedNumbers[0].phone_number,
          text: rawMessageBody,
          code: extractedCode
        });
      }
    }

    return res.status(200).json({ success: true, status: smsPoolStatusFlag, otp_code: extractedCode });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Sync failure." });
  }
});

export default router;
