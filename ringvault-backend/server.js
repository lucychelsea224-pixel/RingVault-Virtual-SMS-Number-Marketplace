import express from 'express';
import cors from 'cors';
import "dotenv/config";
import numbersRouter from './routes/numbers.js';
import walletRouter from './routes/wallet.js';

const app = express();

// CRITICAL: Must capture rawBody before express.json() parses it
app.use(express.json({ 
  verify: (req, res, buf) => {
    if (req.originalUrl === '/api/wallet/paystack-webhook') {
      req.rawBody = buf;
    }
  }
}));

app.use(cors({ origin: true, credentials: true }));

app.use('/api', numbersRouter);
app.use('/api/wallet', walletRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server online at ${PORT}`));