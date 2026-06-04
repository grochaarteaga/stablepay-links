-- Adds partner_order_id to withdrawals so Transak webhooks can look up
-- the withdrawal by the partnerOrderId we sent when creating the widget URL.
-- Also adds a type column to distinguish crypto withdrawals from fiat off-ramps.

ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS partner_order_id text,
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'crypto';

CREATE UNIQUE INDEX IF NOT EXISTS withdrawals_partner_order_id_idx
  ON withdrawals (partner_order_id)
  WHERE partner_order_id IS NOT NULL;
