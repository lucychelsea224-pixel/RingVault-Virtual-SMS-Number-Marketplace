import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

// POST /api/webhook - Handles incoming SMS from Twilio
router.post("/webhook", async (req, res) => {
  try {
    // Twilio webhooks send data as url-encoded form values (req.body)
    const { MessageSid, From, To, Body } = req.body;
    
    if (!To) {
      return res.status(400).send("Missing recipient metadata");
    }

    // Lookup who owns this phone number in your database
    const { data: owner } = await supabaseAdmin
      .from("user_numbers")
      .select("user_id, id")
      .eq("phone_number", To)
      .single();

    if (owner) {
      // Save incoming SMS to log table so it displays in your frontend inbox
      const { error: logError } = await supabaseAdmin.from("sms_logs").insert({
        telnyx_message_id: MessageSid, // Keeping column name or mapping string
        user_id: owner.user_id,
        user_number_id: owner.id,
        from_number: From || "Unknown",
        to_number: To,
        body: Body || "",
        received_at: new Date().toISOString()
      });

      if (logError) {
        console.error("❌ Error inserting SMS log into Supabase:", logError.message);
      }
    }

    // Twilio expects a valid TwiML response back, an empty <Response /> is perfect
    res.type('text/xml');
    return res.send('<Response></Response>');

  } catch (error) {
    console.error("❌ Global Webhook Handler Exception:", error.message || error);
    return res.status(500).send("Internal Server Error");
  }
});

export default router;