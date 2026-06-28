import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import numbersRouter from './routes/numbers.js';
import walletRouter from './routes/wallet.js';
import webhookRouter from './routes/webhook.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));

app.use(express.json({
  verify: (req, _res, buf) => {
    if (req.originalUrl === '/api/wallet/paystack-webhook') {
      req.rawBody = buf;
    }
  }
}));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'RingVault API is operational' });
});

app.use('/api', numbersRouter);
app.use('/api/wallet', walletRouter);
app.use('/api', webhookRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ RingVault API online at port ${PORT}`));
