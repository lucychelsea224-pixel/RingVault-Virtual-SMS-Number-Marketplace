import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return a mock or throw a cleaner error, 
    // or simply return null to handle it gracefully in your app
    console.warn("Supabase environment variables are missing!");
    return null as any; 
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}