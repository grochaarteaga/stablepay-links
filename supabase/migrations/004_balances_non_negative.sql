-- Prevent merchant balance from going negative.
-- Guards against double-submit race conditions on the withdrawals route
-- where two concurrent requests both pass the in-memory balance check
-- before either debit lands.
ALTER TABLE balances
  ADD CONSTRAINT balances_amount_non_negative CHECK (amount >= 0);
