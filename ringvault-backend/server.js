import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRouter from './routes/auth.js';
import walletRouter from './routes/wallet.js';
import numbersRouter from './routes/numbers.js';
import webhookRouter from './routes/webhook.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'RingVault API is operational' });
});

// Mounted Routes
app.use('/api/auth', authRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/numbers', numbersRouter);
app.use('/api/webhook', webhookRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
