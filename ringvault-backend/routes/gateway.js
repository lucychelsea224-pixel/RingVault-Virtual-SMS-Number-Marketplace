import { Router } from 'express';
import { getAdapter, AVAILABLE_GATEWAYS } from '../adapters/registry.js';
import { supabaseAdmin, getUser } from '../lib/supabase.js';

const router = Router();

const RETAIL_PRICE = 2.00;

// ─── POST /api/fetch-number ───────────────────────────────────────────────────
// Accepts: { gateway, service, country }
// Returns: { orderId, phone, gateway }
router.post('/fetch-number', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { gateway, service, country } = req.body;
    if (!gateway || !service) {
      return res.status(400).json({ success: false, error: 'gateway and service are required.' });
    }

    // Deduct balance before hitting the provider
    const { data: balanceCheck, error: balanceError } = await supabaseAdmin.rpc('deduct_balance', {
      p_user_id:    user.id,
      p_amount:     RETAIL_PRICE,
      p_description: `Number purchase via ${gateway} for ${service}`,
    });

    if (balanceError || !balanceCheck || balanceCheck.ok === false) {
      return res.status(402).json({ success: false, error: 'Insufficient wallet balance.' });
    }

    try {
      const adapter = getAdapter(gateway);
      const { orderId, phone } = await adapter.fetchNumber(service, country);

      // Persist to user_numbers so dashboard + inbox can track it
      const { data: row, error: insertErr } = await supabaseAdmin.from('user_numbers').insert({
        user_id:          user.id,
        phone_number:     phone,
        telnyx_number_id: orderId,
        country_code:     country || '1',
        status:           'active',
        amount_paid:      RETAIL_PRICE,
        service_name:     service.toLowerCase(),
        gateway:          gateway,
        expires_at:       new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }).select().single();

      if (insertErr) throw insertErr;

      return res.json({ success: true, orderId, phone, gateway, number_id: row.id });
    } catch (providerErr) {
      // Auto-refund if provider fails after balance was deducted
      await supabaseAdmin.rpc('credit_balance', { p_user_id: user.id, p_amount: RETAIL_PRICE });
      return res.status(502).json({ success: false, error: providerErr.message });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/check-sms ───────────────────────────────────────────────────────
// Accepts: ?gateway=gatewayA&orderId=12345
// Returns: { status: 'PENDING'|'RECEIVED'|'EXPIRED', code: string|null }
router.get('/check-sms', async (req, res) => {
  try {
    const { gateway, orderId } = req.query;
    if (!gateway || !orderId) {
      return res.status(400).json({ success: false, error: 'gateway and orderId are required.' });
    }

    const adapter  = getAdapter(gateway);
    const { status, code } = await adapter.checkSMS(orderId);

    // If code arrived, persist it to sms_logs so the inbox picks it up
    if (status === 'RECEIVED' && code) {
      const { data: numberRows } = await supabaseAdmin
        .from('user_numbers')
        .select('id, user_id, phone_number, service_name')
        .eq('telnyx_number_id', orderId)
        .limit(1);

      const row = numberRows?.[0];
      if (row) {
        await supabaseAdmin.from('user_numbers').update({
          status:   'completed',
          sms_code: code,
        }).eq('id', row.id);

        await supabaseAdmin.from('sms_logs').insert({
          telnyx_message_id: `gw_${gateway}_${orderId}`,
          user_id:           row.user_id,
          user_number_id:    row.id,
          from_number:       'Verification',
          to_number:         row.phone_number,
          body:              `Your verification code: ${code}`,
          otp_code:          code,
          service_name:      row.service_name,
          received_at:       new Date().toISOString(),
        }).on_conflict('telnyx_message_id').ignore();
      }
    }

    return res.json({ success: true, status, code });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/cancel-order ───────────────────────────────────────────────────
// Accepts: { gateway, orderId, number_id }
// Returns: { success: boolean }
router.post('/cancel-order', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { gateway, orderId, number_id } = req.body;
    if (!gateway || !orderId) {
      return res.status(400).json({ success: false, error: 'gateway and orderId are required.' });
    }

    // Check the number belongs to this user and hasn't received a code
    const { data: numberRow } = await supabaseAdmin
      .from('user_numbers')
      .select('*')
      .eq('id', number_id)
      .eq('user_id', user.id)
      .single();

    if (!numberRow) {
      return res.status(404).json({ success: false, error: 'Number not found on your account.' });
    }
    if (numberRow.sms_code) {
      return res.status(400).json({ success: false, error: 'Code already received — cancellation not possible.' });
    }

    const adapter = getAdapter(gateway);
    const { success } = await adapter.cancelOrder(orderId);

    if (success) {
      const refundAmount = numberRow.amount_paid || RETAIL_PRICE;
      await supabaseAdmin.rpc('credit_balance', { p_user_id: user.id, p_amount: refundAmount });
      await supabaseAdmin.from('user_numbers').update({ status: 'refunded' }).eq('id', number_id);
    }

    return res.json({ success });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/gateways ────────────────────────────────────────────────────────
// Returns the list of available anonymous gateway names
router.get('/gateways', (_req, res) => {
  res.json({ success: true, gateways: AVAILABLE_GATEWAYS });
});

export default router;
