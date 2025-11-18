-- Migration: add product message support to noidungchat
-- Adds message_type and product_snapshot columns if they do not exist.
-- Safe for re-run (checks existence where possible).

-- message_type: 'text' | 'product' | future values
ALTER TABLE noidungchat ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text'::text;
-- product_snapshot: JSON payload with product info (masanpham, tensanpham, hinhanh, giaban, kichco, mausac, soluong)
ALTER TABLE noidungchat ADD COLUMN IF NOT EXISTS product_snapshot jsonb;

-- Optional index to filter product messages quickly (partial index)
CREATE INDEX IF NOT EXISTS idx_noidungchat_message_type ON noidungchat(message_type);
-- Optional GIN index for product_snapshot if querying nested fields later
-- CREATE INDEX IF NOT EXISTS idx_noidungchat_product_snapshot_gin ON noidungchat USING GIN (product_snapshot);

-- Backfill existing rows: ensure message_type is not null
UPDATE noidungchat SET message_type = 'text' WHERE message_type IS NULL;
