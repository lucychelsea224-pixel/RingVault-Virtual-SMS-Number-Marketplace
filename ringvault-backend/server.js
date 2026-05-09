import express from 'express';
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Get variables safely
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Line 7: Defensive initialization to prevent the crash
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
app.use(express.json());

// --- ADD YOUR ROUTES HERE ---

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'server is running' });
});

// Render requires the server to listen on the PORT variable
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  if (!supabaseUrl) console.log("⚠️ Warning: Supabase URL is not configured.");
});