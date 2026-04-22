-- ============================================================
-- 001_topups.sql
-- EUR → USDC top-up flow via Bridge
-- ============================================================

-- ── partner_accounts ────────────────────────────────────────
-- One virtual IBAN per merchant, issued by Bridge.
-- A merchant may have at most one active Bridge account.

CREATE TABLE partner_accounts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id         uuid        NOT NULL REFERENCES auth.users(id),
  partner             text        NOT NULL DEFAULT 'bridge',
  partner_customer_id text        NOT NULL,
  virtual_iban        text        NOT NULL,
  iban_bic            text,
  status              text        NOT NULL DEFAULT 'pending_kyb',
  -- status values: pending_kyb | active | suspended
  created_at          timestamptz DEFAULT now(),
  UNIQUE (merchant_id, partner)
);

ALTER TABLE partner_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own partner accounts"
  ON partner_accounts FOR SELECT
  USING (merchant_id = auth.uid());

-- ── topups ──────────────────────────────────────────────────
-- One row per top-up intent.  Updated via Bridge webhooks.

CREATE TABLE topups (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id           uuid          NOT NULL REFERENCES auth.users(id),
  partner_account_id    uuid          NOT NULL REFERENCES partner_accounts(id),
  reference             text          NOT NULL UNIQUE,
  status                text          NOT NULL DEFAULT 'awaiting_deposit',
  -- status values: awaiting_deposit | deposit_received | converting
  --                | converted | completed | failed | expired
  eur_amount_expected   numeric(18,2),
  eur_amount_received   numeric(18,2),
  fx_rate               numeric(18,8),
  usdc_amount           numeric(18,6),
  partner_fee_eur       numeric(18,2),
  destination_wallet    text          NOT NULL,
  partner_topup_id      text,
  partner_quote_id      text,
  tx_hash               text,
  error_message         text,
  expires_at            timestamptz,
  created_at            timestamptz   DEFAULT now(),
  updated_at            timestamptz   DEFAULT now()
);

ALTER TABLE topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own topups"
  ON topups FOR SELECT
  USING (merchant_id = auth.uid());

-- ── topup_events ─────────────────────────────────────────────
-- Immutable audit log of all Bridge webhook events.

CREATE TABLE topup_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  topup_id         uuid        REFERENCES topups(id),
  event_type       text        NOT NULL,
  partner_event_id text,
  payload          jsonb       NOT NULL,
  received_at      timestamptz DEFAULT now()
);

ALTER TABLE topup_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own topup events"
  ON topup_events FOR SELECT
  USING (
    topup_id IN (
      SELECT id FROM topups WHERE merchant_id = auth.uid()
    )
  );
