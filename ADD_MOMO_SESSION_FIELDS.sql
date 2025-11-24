-- Adds MOMO session tracking fields to donhang table for 3-minute QR expiry logic
-- Run this migration in Supabase / Postgres environment
ALTER TABLE donhang
  ADD COLUMN IF NOT EXISTS momo_order_id text,
  ADD COLUMN IF NOT EXISTS momo_request_id text,
  ADD COLUMN IF NOT EXISTS momo_qr_code_url text,
  ADD COLUMN IF NOT EXISTS momo_expires_at timestamptz;

-- Optional index to quickly find non-expired sessions
CREATE INDEX IF NOT EXISTS idx_donhang_momo_expires_at ON donhang(momo_expires_at);
