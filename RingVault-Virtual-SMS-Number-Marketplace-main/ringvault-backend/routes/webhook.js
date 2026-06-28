import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

// POST /api/webhook - Listens for live incoming SMS logs from Sendchamp
router.post("/webhook", async (req, res) => {
  try {
    const { id, sender, recipient, message } = req.body;
    
    if (!recipient) {
      return res.status(400).json({ success: false, error: "Missing metadata parameters" });
    }

    // Scan database inventory to locate the RingVault user who bought this number
    const { data: owner } = await supabaseAdmin
      .from("user_numbers")
      .select("user_id, id")
      .eq("phone_number", recipient)
      .single();

    if (owner) {
      // Put the text message safely inside your user's UI inbox
      const { error: logError } = await supabaseAdmin.from("sms_logs").insert({
        telnyx_message_id: id || `sc_${Date.now()}`, 
        user_id: owner.user_id,
        user_number_id: owner.id,
        from_number: sender || "Unknown",
        to_number: recipient,
        body: message || "",
        received_at: new Date().toISOString()
      });

      if (logError) {
        console.error("❌ Database insert failure during webhook capture:", logError.message);
      }
    }

    return res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("❌ Webhook Engine Crash:", error.message || error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;