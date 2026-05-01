// lib/supabase.js
// Two clients:
//   supabaseAdmin  – uses SERVICE_ROLE key (bypasses RLS). Use ONLY on the server.
//   supabaseClient – uses ANON key (respects RLS). Suitable for user-scoped queries
//                    when the caller supplies an auth token.

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } =
  process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing Supabase environment variables. Check your .env file."
  );
}

/**
 * Admin client – bypasses Row Level Security.
 * Use for:
 *   • Balance deductions  (atomic updates)
 *   • Inserting SMS logs from the webhook
 *   • Reading any row regardless of user
 *
 * ⚠️  Never send this client or its key to the browser.
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
 * Use for:
 *   • Reading a user's own profile when their JWT is present
 *   • Auth helpers (e.g., verifying a Bearer token)
 */
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Verify a Supabase JWT from an Authorization: Bearer <token> header.
 * Returns { user } on success, throws on failure.
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
