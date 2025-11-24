-- Migration: add audit table for donhang.trangthaidonhang changes
CREATE TABLE IF NOT EXISTS donhang_trangthai_audit (
  id bigserial PRIMARY KEY,
  madonhang bigint NOT NULL,
  old_trangthai text,
  new_trangthai text,
  actor_type text, -- 'STAFF' | 'ADMIN' | 'SYSTEM' | 'CUSTOMER'
  actor_id bigint,
  actor_name text,
  note text,
  created_at timestamptz DEFAULT now()
);

-- Pending refunds table to track gateway verification
CREATE TABLE IF NOT EXISTS trahang_refund_pending (
  id bigserial PRIMARY KEY,
  matrahang bigint NOT NULL,
  madonhang bigint,
  amount numeric,
  method text,
  status text DEFAULT 'PENDING', -- PENDING | CONFIRMED | FAILED
  external_txn_id text,
  created_by bigint,
  created_by_name text,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  confirmed_by bigint,
  confirmed_by_name text,
  note text
);
