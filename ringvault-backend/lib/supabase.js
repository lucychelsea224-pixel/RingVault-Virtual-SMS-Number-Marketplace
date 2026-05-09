import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Fallback logic: Checks for both standard and Next.js style naming
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log to Render console to help you debug during startup
if (!supabaseUrl) {
  console.error("❌ ERROR: SUPABASE_URL is undefined. Check Render Environment variables.");
}

export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceRole || '', {
  auth: { 
    persistSession: false,
    autoRefreshToken: false 
  },
});

export const supabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Helper to get user from request headers
 */
export async function getUser(req) {
  // Check both standard Express headers and Web Request headers
  const authHeader = req.headers.get ? req.headers.get("authorization") : req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  
  if (!token) return null;
  
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);
  if (error) return null;
  return user;
}