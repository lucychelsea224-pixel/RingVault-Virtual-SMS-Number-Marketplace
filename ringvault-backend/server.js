// server.js (Backend)
import express from 'express';
import cors from 'cors';
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = express();

// 1. Setup variables from Render Environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 2. CORS: Replace the URL below with your actual Vercel deployment URL
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://ringvault-frontend.vercel.app' // 🚨 CHANGE THIS TO YOUR LIVE FRONTEND URL
  ],
  credentials: true
}));

app.use(express.json());

// 3. Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 4. API Routes
app.get('/api/wallet/balance', async (req, res) => {
  try {
    // Your logic to fetch balance from database
    res.json({ success: true, balance: 0.00 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
});