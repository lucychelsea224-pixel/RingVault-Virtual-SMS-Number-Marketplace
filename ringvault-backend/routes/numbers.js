import express from 'express';
import Telnyx from 'telnyx';
import { supabaseAdmin, getUser } from '../lib/supabase.js'; // Ensure correct path and .js extension

const router = express.Router();
const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

// POST: Buy a number
router.post('/buy-number', async (req, res) => {
  try {
    // 1. Authenticate user using Express request object
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // In Express, body-parser/express.json() parses req.body automatically
    const { phone_number } = req.body;
    if (!phone_number) {
      return res.status(400).json({ success: false, error: "Phone number is required" });
    }

    const PRICE = 2.0;

    // 2. Atomic Deduction via SQL RPC
    const { data: result, error: dbError } = await supabaseAdmin.rpc("deduct_balance", {
      p_user_id: user.id,
      p_amount: PRICE,
      p_description: `Purchased ${phone_number}`
    });

    if (dbError || !result?.ok) {
      return res.status(402).json({ success: false, error: result?.reason || "Balance error" });
    }

    try {
      // 3. Telnyx Order Execution
      const order = await telnyx.numberOrders.create({
        phone_numbers: [{ phone_number }],
        messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID,
      });

      // 4. Save Record to Database
      const { error: insertError } = await supabaseAdmin.from("user_numbers").insert({
        user_id: user.id,
        phone_number: phone_number,
        telnyx_number_id: order.data.phone_numbers[0].id,
        status: "active",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (insertError) throw insertError;

      return res.status(200).json({ success: true });

    } catch (err) {
      console.error("Telnyx/DB Insertion Error:", err.message || err);
      
      // 5. Refund Wallet on API Failures
      await supabaseAdmin.rpc("credit_balance", { 
        p_user_id: user.id, 
        p_amount: PRICE 
      });
      
      return res.status(502).json({ success: false, error: "Telnyx error. Refunded." });
    }
  } catch (globalError) {
    console.error("Global purchase route crash:", globalError);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;