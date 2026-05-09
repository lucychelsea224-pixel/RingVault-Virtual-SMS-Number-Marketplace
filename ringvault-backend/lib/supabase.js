import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// 1. Get variables with fallbacks for naming and empty values
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 2. Debugging: This will print to your Render logs
if (!supabaseUrl) {
  console.error("❌ CRITICAL: SUPABASE_URL is missing from Render Environment.");
}

// 3. Initialize Clients
// The '' fallback prevents the "supabaseUrl is required" crash
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { 
    persistSession: false,
    autoRefreshToken: false 
  },
});

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Robust getUser helper that works with Express and Fetch API headers
 */
export async function getUser(req) {
  const authHeader = req.headers?.get ? req.headers.get("authorization") : req.headers?.authorization;
  const token = authHeader?.split(" ")[1];
  
  if (!token) return null;
  
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);
  if (error || !user) return null;
  return user;
}