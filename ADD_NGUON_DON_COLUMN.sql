-- Add nguon_don (order source) column to donhang table
-- This helps differentiate between employee-created orders (POS) and customer orders (MOBILE/WEB)

-- Add the column if it doesn't exist
ALTER TABLE donhang 
ADD COLUMN IF NOT EXISTS nguon_don VARCHAR(20) DEFAULT 'MOBILE';

-- Add a comment to explain the column
COMMENT ON COLUMN donhang.nguon_don IS 'Order source: POS (employee-created), MOBILE (customer app), WEB (customer website)';

-- Optional: Update existing orders with manhanvien to be marked as POS
UPDATE donhang 
SET nguon_don = 'POS' 
WHERE manhanvien IS NOT NULL 
  AND nguon_don IS NULL;

-- Optional: Create an index for faster filtering by source
CREATE INDEX IF NOT EXISTS idx_donhang_nguon_don ON donhang(nguon_don);

-- View all orders with their source
-- SELECT madonhang, makhachhang, manhanvien, nguon_don, trangthaidonhang, ngaydathang
-- FROM donhang
-- ORDER BY madonhang DESC
-- LIMIT 20;
