// lib/supabase.js
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

/**
 * We check every possible name variation to ensure Render picks it up.
 * Node.js on Render is case-sensitive and does not use a local .env file.
 */
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 1. Log the status to your Render console so you can see if the keys are found
if (!supabaseUrl) {
  console.error("❌ RENDER ENV ERROR: SUPABASE_URL is missing from the Environment tab.");
}

// 2. Initialize the Admin Client (used for server-side balance/logic)
export const supabaseAdmin = createClient(
  supabaseUrl || "", 
  supabaseServiceRole || "", 
  {
    auth: { 
      persistSession: false,
      autoRefreshToken: false 
    },
  }
);

// 3. Initialize the Public Client
export const supabaseClient = createClient(
  supabaseUrl || "", 
  supabaseAnonKey || ""
);

/**
 * Updated getUser helper to handle both Express and Web Request objects
 */
export async function getUser(req) {
  // Check if headers is a Map (Next.js) or an Object (Express)
  const authHeader = req.headers?.get ? req.headers.get("authorization") : req.headers?.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);
  
  if (error || !user) return null;
  return user;
}