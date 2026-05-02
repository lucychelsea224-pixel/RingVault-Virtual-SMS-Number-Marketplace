// server.js – RingVault Backend Entry Point
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import numbersRouter from "./routes/numbers.js";
import walletRouter from "./routes/wallet.js";
import webhookRouter from "./routes/webhook.js";

const app = express();

app.set('trust proxy', 1);

const PORT = process.env.PORT || 4000;

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
});

const buyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10,                   
  message: { success: false, error: "Purchase rate limit exceeded." },
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

app.use("/api/buy-number", buyLimiter);
app.use("/api", apiLimiter);

app.use("/api", numbersRouter);                          
app.use("/api/wallet", walletRouter);                    
app.post("/webhook/sms", webhookRouter);                 

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found." });
});

app.use((err, _req, res, _next) => {
  console.error("[server error]", err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error." : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 RingVault backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Env:    ${process.env.NODE_ENV || "development"}\n`);
});