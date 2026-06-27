import express from 'express';
import cors from 'cors';
import "dotenv/config";

import numbersRouter from './routes/numbers.js';
import walletRouter from './routes/wallet.js';
import webhookRouter from './routes/webhook.js';

const app = express();

// 1. CAPTURE RAW BODY FOR WEBHOOKS (CRITICAL FOR PAYSTACK SECURITY)
app.use(express.json({ 
  verify: (req, res, buf) => {
    // Only capture the raw buffer for the wallet webhook route
    if (req.originalUrl.includes('/api/wallet/paystack-webhook')) {
      req.rawBody = buf;
    }
  }
}));

// 2. CORS CONFIGURATION
const allowedOrigins = [
  'http://localhost:3000',
  'https://ringvault-virtual-sms-number-marketplace.pages.dev'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.pages.dev')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 3. MOUNT ROUTES
app.use('/api', numbersRouter);
app.use('/api/wallet', walletRouter); 
app.use('/api', webhookRouter);

app.get('/', (req, res) => {
  res.json({ status: "online", message: "RingVault API is fully functional" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend listening on port ${PORT}`);
});