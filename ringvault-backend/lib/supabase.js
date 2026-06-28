import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  console.error("❌ CRITICAL: SUPABASE_URL is missing from environment.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export async function getUser(req) {
  const authHeader = req.headers?.get ? req.headers.get("authorization") : req.headers?.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);
  if (error || !user) return null;
  return user;
}
