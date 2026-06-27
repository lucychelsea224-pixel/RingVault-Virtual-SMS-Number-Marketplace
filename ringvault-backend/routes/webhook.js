import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

// POST /api/webhook - Handles incoming SMS from Telnyx
router.post("/webhook", async (req, res) => {
  try {
    // In Express, req.body is already parsed into a JavaScript object
    const json = req.body;
    
    if (!json || !json.data || !json.data.payload) {
      return res.status(400).json({ success: false, error: "Invalid Telnyx payload" });
    }

    // Extract SMS info from Telnyx payload
    const { payload } = json.data;
    
    if (!payload.to || payload.to.length === 0) {
      return res.status(200).json({ received: true, message: "No recipient numbers found" });
    }

    const toNumber = payload.to[0].phone_number;

    // Lookup user owner
    const { data: owner } = await supabaseAdmin
      .from("user_numbers")
      .select("user_id, id")
      .eq("phone_number", toNumber)
      .single();

    if (owner) {
      const { error: logError } = await supabaseAdmin.from("sms_logs").insert({
        telnyx_message_id: payload.id,
        user_id: owner.user_id,
        user_number_id: owner.id,
        from_number: payload.from?.phone_number || "Unknown",
        to_number: toNumber,
        body: payload.text || "",
        received_at: payload.received_at || new Date().toISOString()
      });

      if (logError) {
        console.error("❌ Error inserting SMS log into Supabase:", logError.message);
      }
    }

    // Webhooks MUST return a 200 OK status quickly
    return res.status(200).send("OK");

  } catch (error) {
    console.error("❌ Global Webhook Handler Exception:", error.message || error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;