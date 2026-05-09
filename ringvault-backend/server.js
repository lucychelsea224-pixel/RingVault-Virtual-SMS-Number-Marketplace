// server.js (Backend on Render)
import express from 'express';
import cors from 'cors';
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = express();

// Use the exact variables found in your setup
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 2. CORS: Allows your Cloudflare Pages domain to make requests
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://ringvault-virtual-sms-number-marketplace.pages.dev' 
  ],
  credentials: true
}));

app.use(express.json());

// 3. Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Example route to verify connectivity
app.get('/api/wallet/balance', async (req, res) => {
  res.json({ success: true, balance: 0.00 });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend listening on port ${PORT}`);
});