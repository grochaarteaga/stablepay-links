-- Add idempotency flag so welcome email is never sent twice for the same user
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_email_sent boolean NOT NULL DEFAULT false;
