-- Add nguon_don column to donhang table
ALTER TABLE donhang 
ADD COLUMN IF NOT EXISTS nguon_don VARCHAR(20) DEFAULT 'MOBILE';

-- Update existing orders with employee to POS
UPDATE donhang 
SET nguon_don = 'POS' 
WHERE manhanvien IS NOT NULL 
  AND (nguon_don IS NULL OR nguon_don = 'MOBILE');

-- Create index
CREATE INDEX IF NOT EXISTS idx_donhang_nguon_don ON donhang(nguon_don);

-- Verify
SELECT madonhang, manhanvien, nguon_don, trangthaidonhang 
FROM donhang 
ORDER BY madonhang DESC 
LIMIT 10;
