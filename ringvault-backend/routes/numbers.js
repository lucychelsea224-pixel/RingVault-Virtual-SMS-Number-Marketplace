import { NextResponse } from 'next/server';
import Telnyx from 'telnyx';
import { supabaseAdmin, getUser } from '@/lib/supabase';

const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone_number } = await req.json();
  const PRICE = 2.0;

  // 1. Atomic Deduction via SQL RPC
  const { data: result, error: dbError } = await supabaseAdmin.rpc("deduct_balance", {
    p_user_id: user.id,
    p_amount: PRICE,
    p_description: `Purchased ${phone_number}`
  });

  if (dbError || !result?.ok) {
    return NextResponse.json({ error: result?.reason || "Balance error" }, { status: 402 });
  }

  try {
    // 2. Telnyx Order
    const order = await telnyx.numberOrders.create({
      phone_numbers: [{ phone_number }],
      messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID,
    });

    // 3. Save to DB
    await supabaseAdmin.from("user_numbers").insert({
      user_id: user.id,
      phone_number: phone_number,
      telnyx_number_id: order.data.phone_numbers[0].id,
      status: "active",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    // 4. Refund on failure
    await supabaseAdmin.rpc("credit_balance", { p_user_id: user.id, p_amount: PRICE });
    return NextResponse.json({ error: "Telnyx error. Refunded." }, { status: 502 });
  }
}