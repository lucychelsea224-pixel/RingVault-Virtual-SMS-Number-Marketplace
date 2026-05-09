// lib/supabase.js
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// This update looks for BOTH standard and NEXT_PUBLIC prefixed variables 
// to ensure Render finds them regardless of how you named them in the dashboard.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Strict check to stop the server with a clear message if keys are missing
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ DEPLOYMENT ERROR: Missing environment variables.");
  console.error("Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in Render Environment settings.");
  throw new Error("Missing Supabase environment variables.");
}

/**
 * Admin client – bypasses Row Level Security.
 * Used for atomic balance updates and webhook logging.
 */
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Public client – respects RLS.
 * Used for verifying user tokens.
 */
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Verify a Supabase JWT from an Authorization header.
 */
export async function getUserFromToken(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header.");
  }
  const token = authHeader.slice(7);
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser(token);
  
  if (error || !user) throw new Error("Invalid or expired token.");
  return user;
}