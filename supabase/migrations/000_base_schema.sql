-- ================================================================
-- 000_base_schema.sql
-- Base tables that pre-existed the migration system.
-- Run this FIRST on a fresh Supabase project, then run 001–005.
-- ================================================================

-- ── profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name         text,
  country              text,
  business_type        text,
  onboarding_step      integer     NOT NULL DEFAULT 1,
  onboarding_completed boolean     NOT NULL DEFAULT false,
  welcome_email_sent   boolean     NOT NULL DEFAULT false,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── merchant_profiles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_profiles (
  id               uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid  NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  privy_wallet_id  text,
  wallet_address   text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE merchant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own merchant profile"
  ON merchant_profiles FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own merchant profile"
  ON merchant_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own merchant profile"
  ON merchant_profiles FOR UPDATE USING (user_id = auth.uid());

-- ── invoices ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id            uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  amount                 numeric(18,6) NOT NULL,
  currency               text        DEFAULT 'USDC',
  customer               text,
  description            text,
  status                 text        NOT NULL DEFAULT 'pending',
  invoice_wallet_address text,
  encrypted_private_key  text,
  tx_hash                text,
  paid_at                timestamptz,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invoices"
  ON invoices FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE USING (merchant_id = auth.uid());

-- ── ledger_entries ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_entries (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id           uuid        NOT NULL REFERENCES auth.users(id),
  invoice_id            uuid        REFERENCES invoices(id),
  type                  text        NOT NULL CHECK (type IN ('credit','debit')),
  amount                numeric(18,6) NOT NULL CHECK (amount > 0),
  tx_hash               text,
  description           text,
  reversal_of           uuid        REFERENCES ledger_entries(id),
  idempotency_key       text,
  ledger_transaction_id uuid,
  metadata              jsonb,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ledger entries"
  ON ledger_entries FOR SELECT USING (merchant_id = auth.uid());

-- ── payout_wallets ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_wallets (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_name text  NOT NULL,
  address     text  NOT NULL,
  network     text  NOT NULL DEFAULT 'base',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE payout_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payout wallets"
  ON payout_wallets FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payout wallets"
  ON payout_wallets FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own payout wallets"
  ON payout_wallets FOR DELETE USING (user_id = auth.uid());

-- ── withdrawals ──────────────────────────────────────────────
-- wallet_id is nullable to support fiat off-ramp withdrawals (Transak)
-- where no crypto payout wallet is involved.
CREATE TABLE IF NOT EXISTS withdrawals (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id),
  wallet_id        uuid        REFERENCES payout_wallets(id),
  amount           numeric(18,6) NOT NULL,
  status           text        NOT NULL DEFAULT 'pending',
  type             text        NOT NULL DEFAULT 'crypto',
  tx_hash          text,
  error_message    text,
  partner_order_id text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own withdrawals"
  ON withdrawals FOR SELECT USING (user_id = auth.uid());
