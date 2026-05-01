# RingVault – Virtual SMS Number Marketplace

A full-stack service where users buy USA/International virtual numbers for SMS
verification (OTP) on apps like WhatsApp and Facebook.

**Stack**: Next.js + Tailwind · Node.js/Express · Telnyx · Supabase · Paystack

---

## Project Structure

```
ringvault-backend/
├── server.js                  # Express entry point
├── schema.sql                 # Supabase schema + RPCs + RLS policies
├── .env.example               # Environment variable template
├── package.json
├── lib/
│   └── supabase.js            # Admin + anon Supabase clients
├── middleware/
│   └── auth.js                # JWT verification middleware
├── routes/
│   ├── numbers.js             # /api/search-numbers, /api/buy-number
│   ├── wallet.js              # /api/wallet/balance, /api/wallet/verify-payment
│   └── webhook.js             # /webhook/sms (Telnyx inbound SMS)
└── hooks/
    └── useRealtimeSMS.js      # React hook + Paystack helper
```

---

## Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd ringvault-backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Fill in TELNYX_API_KEY, SUPABASE_*, PAYSTACK_SECRET_KEY, etc.
```

### 3. Set Up Supabase
1. Create a new project at https://app.supabase.com
2. Go to **SQL Editor** → paste the contents of `schema.sql` → Run
3. Enable **Realtime** for the `sms_logs` table (already in schema.sql)
4. Copy your Project URL + keys into `.env`

### 4. Configure Telnyx
1. Sign up at https://telnyx.com and get an API key
2. Buy or port a number in the Telnyx portal
3. Create a **Messaging Profile** and link it to your number
4. Set the webhook URL to `https://your-domain.com/webhook/sms`
5. Copy your **Connection ID** and **Webhook Signing Key** into `.env`

### 5. Run
```bash
npm run dev           # Development (with nodemon)
npm start             # Production
```

---

## API Reference

### Numbers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/search-numbers` | ✅ | Search Telnyx for available SMS numbers |
| POST | `/api/buy-number` | ✅ | Purchase a number (checks balance, orders, deducts) |
| GET | `/api/my-numbers` | ✅ | List the user's active numbers |
| DELETE | `/api/release-number/:id` | ✅ | Release/cancel a number |

**GET `/api/search-numbers`** query params:
- `country_code` – ISO 2-letter code (e.g. `US`)
- `administrative_area` – State/region (e.g. `California`)
- `limit` – 1–50 (default 20)

**POST `/api/buy-number`** body:
```json
{ "phone_number": "+16505550191" }
```

### Wallet

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wallet/balance` | ✅ | Get current balance |
| GET | `/api/wallet/transactions` | ✅ | Transaction history |
| POST | `/api/wallet/verify-payment` | ✅ | Verify Paystack payment + credit wallet |
| POST | `/api/wallet/paystack-webhook` | ❌ | Paystack server webhook (HMAC verified) |

### Webhook

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/webhook/sms` | Telnyx sig | Receives inbound SMS from Telnyx |

---

## Security Architecture

```
Client (Next.js)
    │
    │  Supabase JWT (Bearer token)
    ▼
Express API (server.js)
    │
    ├─ requireAuth middleware        ← Verifies JWT, attaches req.user
    │
    ├─ /api/buy-number
    │       │
    │       ├─ deduct_balance() RPC  ← Postgres-level row lock (no race conditions)
    │       │
    │       └─ Telnyx Order API      ← Server-to-server only
    │
    └─ /webhook/sms
            │
            └─ Ed25519 sig verify    ← Rejects forged webhooks
```

Key principles:
- **Balance deduction** happens in a Postgres RPC with `FOR UPDATE` lock
- **Service Role key** is server-only, never in frontend code
- **Paystack verification** always happens server-side (never trust `onSuccess` alone)
- **Telnyx webhooks** are signature-verified before any DB write

---

## Frontend Integration (Next.js)

### SMS Inbox with Realtime
```jsx
import { useRealtimeSMS } from '@/hooks/useRealtimeSMS';

export function SMSInbox({ supabase, userId }) {
  const { messages, isConnected } = useRealtimeSMS(supabase, userId);

  return (
    <div>
      <span>{isConnected ? '🟢 LIVE' : '🔴 Reconnecting…'}</span>
      {messages.map(msg => (
        <div key={msg.id} className={msg.isNew ? 'ring-2 ring-amber-400' : ''}>
          <strong>{msg.service_name}</strong>
          <p>{msg.body}</p>
          {msg.otp_code && (
            <span className="text-2xl font-bold tracking-widest text-amber-400">
              {msg.otp_code}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Paystack Top-Up
```jsx
// 1. Add to pages/_document.js or layout.tsx:
//    <Script src="https://js.paystack.co/v1/inline.js" />

// 2. In your component:
import { initPaystack } from '@/hooks/useRealtimeSMS';

function TopUpButton({ user, onSuccess }) {
  return (
    <button onClick={() => initPaystack({
      email: user.email,
      amountUSD: 10,
      userId: user.id,
      onSuccess: (data) => {
        console.log('Balance now:', data.balance);
        onSuccess(data);
      }
    })}>
      Top Up $10
    </button>
  );
}
```

---

## Deployment

### Render / Railway / Fly.io
```bash
# Set all env vars via dashboard
# Start command:
node server.js
```

### Vercel (API Routes alternative)
If you prefer Next.js API routes over a separate Express server, each route
file maps 1-to-1 — just wrap them in `export default async function handler(req, res)`.

---

## Pricing Model
- Each number: **$2.00/month**
- Telnyx cost: ~$1.00–1.40/number/month (check their portal)
- Your margin: ~$0.60–1.00 per number per month
- Wallet currency: **USD** — converted from NGN via Paystack at checkout

---

## License
MIT
