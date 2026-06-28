import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

router.post("/webhook", async (req, res) => {
  try {
    const { id, sender, recipient, message } = req.body;

    if (!recipient) {
      return res.status(400).json({ success: false, error: "Missing metadata parameters" });
    }

    const { data: owner } = await supabaseAdmin
      .from("user_numbers")
      .select("user_id, id")
      .eq("phone_number", recipient)
      .single();

    if (owner) {
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
        console.error("❌ Webhook DB insert failed:", logError.message);
      }
    }

    return res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("❌ Webhook crash:", error.message || error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
