-- Add extra tracking columns to membership cards
ALTER TABLE IF EXISTS thethanhvien
  ADD COLUMN IF NOT EXISTS tier_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS tichluy_khi_cap NUMERIC DEFAULT 0;

-- Snapshot table to remember tier benefits applied to each order
CREATE TABLE IF NOT EXISTS membership_order_snapshots (
  id BIGSERIAL PRIMARY KEY,
  madonhang INTEGER NOT NULL,
  makhachhang INTEGER NOT NULL,
  tier_snapshot JSONB NOT NULL,
  chi_tieu_cong NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (madonhang)
);
