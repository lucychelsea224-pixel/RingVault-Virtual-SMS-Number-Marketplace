import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { persistSession: false },
});

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export async function getUser(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const { data: { user } } = await supabaseClient.auth.getUser(token);
  return user;
}