-- ============================================================
-- RingVault – Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- One row per auth.users entry. Created automatically via trigger.
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT         NOT NULL,
  full_name     TEXT,
  balance       NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── User Numbers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_numbers (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number      TEXT          NOT NULL UNIQUE,
  telnyx_number_id  TEXT,
  status            TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('active','released','expired')),
  monthly_cost      NUMERIC(8,2)  NOT NULL DEFAULT 2.00,
  expires_at        TIMESTAMPTZ   NOT NULL,
  released_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_numbers_user   ON public.user_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_numbers_number ON public.user_numbers(phone_number);

-- ─── SMS Logs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  telnyx_message_id   TEXT          UNIQUE,                      -- Idempotency
  user_id             UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_number_id      UUID          REFERENCES public.user_numbers(id),
  from_number         TEXT          NOT NULL,
  to_number           TEXT          NOT NULL,
  body                TEXT          NOT NULL,
  otp_code            TEXT,                                       -- Extracted OTP
  service_name        TEXT,                                       -- WhatsApp, Facebook …
  received_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_user       ON public.sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_to_number  ON public.sms_logs(to_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_received   ON public.sms_logs(received_at DESC);

-- ─── Transactions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type                TEXT          NOT NULL CHECK (type IN ('credit','debit')),
  amount              NUMERIC(12,4) NOT NULL CHECK (amount > 0),
  description         TEXT,
  paystack_reference  TEXT          UNIQUE,                       -- Prevents double-credit
  reference           TEXT,                                       -- Telnyx order ID, etc.
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);

-- ─── RPC: deduct_balance (atomic, prevents overdraft) ─────────────────────────
-- Returns: { ok: bool, balance_after: numeric, reason?: text }
CREATE OR REPLACE FUNCTION public.deduct_balance(
  p_user_id UUID,
  p_amount   NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER   -- Runs as DB owner, bypasses RLS for this operation
AS $$
DECLARE
  v_balance NUMERIC;
  v_new_bal NUMERIC;
BEGIN
  -- Lock the profile row to prevent concurrent deductions
  SELECT balance
  INTO v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;                   -- Row-level lock

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'User profile not found.');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object(
      'ok',            false,
      'reason',        'Insufficient balance.',
      'balance_after', v_balance
    );
  END IF;

  v_new_bal := v_balance - p_amount;

  UPDATE public.profiles
  SET balance    = v_new_bal,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'balance_after', v_new_bal);
END;
$$;

-- ─── RPC: credit_balance ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.credit_balance(
  p_user_id UUID,
  p_amount   NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_bal NUMERIC;
BEGIN
  UPDATE public.profiles
  SET balance    = balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance INTO v_new_bal;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'User profile not found.');
  END IF;

  RETURN jsonb_build_object('ok', true, 'balance_after', v_new_bal);
END;
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_numbers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions    ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own row
CREATE POLICY "profiles: own row"    ON public.profiles
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User Numbers: users see only their own numbers
CREATE POLICY "user_numbers: own"   ON public.user_numbers
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SMS Logs: users see only their own messages
CREATE POLICY "sms_logs: own"       ON public.sms_logs
  USING (auth.uid() = user_id);

-- Transactions: users see only their own
CREATE POLICY "transactions: own"   ON public.transactions
  USING (auth.uid() = user_id);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable Realtime on sms_logs so the frontend receives new rows instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_logs;

-- ─── Cron: Auto-expire numbers (requires pg_cron extension) ──────────────────
-- Enable in Supabase Dashboard → Database → Extensions → pg_cron
-- Then uncomment:
--
-- SELECT cron.schedule(
--   'expire-numbers',
--   '0 * * * *',   -- Every hour
--   $$
--     UPDATE public.user_numbers
--     SET status = 'expired'
--     WHERE status = 'active'
--       AND expires_at < NOW();
--   $$
-- );
