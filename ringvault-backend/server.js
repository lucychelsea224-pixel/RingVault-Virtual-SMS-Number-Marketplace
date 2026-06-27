// server.js (Backend on Render)
import express from 'express';
import cors from 'cors';
import "dotenv/config";

// 1. Import your actual route files from the routes folder
import numbersRouter from './routes/numbers.js';
import walletRouter from './routes/wallet.js';
import webhookRouter from './routes/webhook.js';

const app = express();

// 2. Flexible CORS: Allows localhost, your specific pages dev domain, 
// and dynamic subdomains/custom domains from Cloudflare.
const allowedOrigins = [
  'http://localhost:3000',
  'https://ringvault-virtual-sms-number-marketplace.pages.dev'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) 
    // or if the origin matches our list or ends with .pages.dev
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.pages.dev')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// 3. Mount your routes under the /api prefix to match your frontend lib/api.ts
app.use('/api', numbersRouter);
app.use('/api/wallet', walletRouter); // if wallet.js endpoints don't contain '/wallet' inside them, use this.
app.use('/api', webhookRouter);

// Root route so opening the URL in a browser doesn't say "Cannot GET /"
app.get('/', (res) => {
  res.json({ status: "online", message: "RingVault API is fully functional" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend listening on port ${PORT}`);
});