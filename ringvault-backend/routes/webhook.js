export async function POST(req: Request) {
  const body = await req.text();
  const json = JSON.parse(body);
  
  // Extract SMS info from Telnyx payload
  const { payload } = json.data;
  const toNumber = payload.to[0].phone_number;

  // Lookup user owner
  const { data: owner } = await supabaseAdmin
    .from("user_numbers")
    .select("user_id, id")
    .eq("phone_number", toNumber)
    .single();

  if (owner) {
    await supabaseAdmin.from("sms_logs").insert({
      telnyx_message_id: payload.id,
      user_id: owner.user_id,
      user_number_id: owner.id,
      from_number: payload.from.phone_number,
      to_number: toNumber,
      body: payload.text,
      received_at: payload.received_at
    });
  }

  return new Response("OK", { status: 200 });
}