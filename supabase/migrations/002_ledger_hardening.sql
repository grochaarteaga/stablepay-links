-- ================================================================
-- 002_ledger_hardening.sql
-- Harden the ledger with:
--   1. Idempotency constraints (tx_hash + idempotency_key)
--   2. Transaction grouping (ledger_transaction_id)
--   3. Structured metadata (metadata jsonb)
--   4. Append-only immutability (DB-level trigger)
--   5. Materialised balance table (O(1) reads, trigger-maintained)
-- ================================================================

-- ── 1. Unique index on tx_hash ────────────────────────────────
-- Prevents duplicate credits if Alchemy replays the same webhook.
-- Partial: only rows where tx_hash is present (NULLs not constrained).

CREATE UNIQUE INDEX IF NOT EXISTS ledger_entries_tx_hash_uniq
  ON ledger_entries (tx_hash)
  WHERE tx_hash IS NOT NULL;

-- ── 2. Idempotency key ────────────────────────────────────────
-- Deterministic caller-supplied key for entries without a tx_hash.
-- Convention:
--   invoice payments  → 'invoice:<invoice_id>:payment'
--   withdrawal debit  → 'withdrawal:<withdrawal_id>:debit'
--   withdrawal reversal → 'withdrawal:<withdrawal_id>:reversal'
--   Bridge payout     → 'bridge:event:<partner_event_id>'

ALTER TABLE ledger_entries
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS ledger_entries_idempotency_key_uniq
  ON ledger_entries (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ── 3. Transaction grouping ────────────────────────────────────
-- Groups related entries under one UUID so you can audit a full
-- logical operation (e.g. debit + its reversal credit).

ALTER TABLE ledger_entries
  ADD COLUMN IF NOT EXISTS ledger_transaction_id uuid;

CREATE INDEX IF NOT EXISTS ledger_entries_ledger_tx_id_idx
  ON ledger_entries (ledger_transaction_id)
  WHERE ledger_transaction_id IS NOT NULL;

-- ── 4. Structured metadata ─────────────────────────────────────
-- Replaces ad-hoc nullable FKs for cross-referencing sources.
-- e.g. { "topup_id": "...", "partner_event_id": "...", "withdrawal_id": "..." }

ALTER TABLE ledger_entries
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- ── 5. Append-only immutability trigger ───────────────────────
-- The ledger is a tamper-evident log. Once written, an entry can
-- never be modified or deleted — only new entries are allowed.
-- Any UPDATE or DELETE raises a hard exception.

CREATE OR REPLACE FUNCTION ledger_entries_enforce_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'ledger_entries is append-only: % on row id=% is forbidden. Create a correcting entry instead.',
    TG_OP, OLD.id
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS ledger_entries_no_update ON ledger_entries;
CREATE TRIGGER ledger_entries_no_update
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION ledger_entries_enforce_immutable();

DROP TRIGGER IF EXISTS ledger_entries_no_delete ON ledger_entries;
CREATE TRIGGER ledger_entries_no_delete
  BEFORE DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION ledger_entries_enforce_immutable();

-- ── 6. Materialised balance table ─────────────────────────────
-- Stores the running balance per merchant.
-- Updated atomically (same DB transaction) on every ledger INSERT.
-- Reads are O(1) instead of a full-table SUM scan.
--
-- version: monotonically-increasing counter usable as an optimistic
--          lock if you ever need to detect concurrent writes.

CREATE TABLE IF NOT EXISTS balances (
  merchant_id  uuid           PRIMARY KEY REFERENCES auth.users(id),
  amount       numeric(18,6)  NOT NULL DEFAULT 0,
  version      bigint         NOT NULL DEFAULT 0,
  updated_at   timestamptz    NOT NULL DEFAULT now()
);

ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own balance" ON balances;
CREATE POLICY "Users can read own balance"
  ON balances FOR SELECT
  USING (merchant_id = auth.uid());

-- Backfill existing merchants from the current ledger state.
-- ON CONFLICT: safe to run multiple times (idempotent).
INSERT INTO balances (merchant_id, amount, version, updated_at)
SELECT
  merchant_id,
  SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END),
  1,
  now()
FROM ledger_entries
GROUP BY merchant_id
ON CONFLICT (merchant_id) DO UPDATE
  SET amount     = EXCLUDED.amount,
      version    = balances.version + 1,
      updated_at = now();

-- Trigger function: update balance atomically on every new ledger entry.
-- SECURITY DEFINER so the trigger can write to balances regardless of
-- the calling role's RLS policies.

CREATE OR REPLACE FUNCTION ledger_entries_update_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  delta numeric(18,6);
BEGIN
  delta := CASE WHEN NEW.type = 'credit' THEN NEW.amount ELSE -NEW.amount END;

  INSERT INTO balances (merchant_id, amount, version, updated_at)
    VALUES (NEW.merchant_id, delta, 1, now())
  ON CONFLICT (merchant_id) DO UPDATE
    SET amount     = balances.amount + delta,
        version    = balances.version + 1,
        updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ledger_entries_after_insert ON ledger_entries;
CREATE TRIGGER ledger_entries_after_insert
  AFTER INSERT ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION ledger_entries_update_balance();
