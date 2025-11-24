-- Clean up old empty carts for user 11
-- Run this in Supabase SQL Editor

-- 1. Delete all cart items first
DELETE FROM chitietdonhang 
WHERE madonhang IN (
  SELECT madonhang FROM donhang 
  WHERE makhachhang = 11 
  AND trangthaidonhang = 'cart'
);

-- 2. Delete all carts except the most recent one
DELETE FROM donhang
WHERE makhachhang = 11
AND trangthaidonhang = 'cart'
AND madonhang NOT IN (
  SELECT madonhang FROM donhang
  WHERE makhachhang = 11
  AND trangthaidonhang = 'cart'
  ORDER BY ngaydathang DESC
  LIMIT 1
);

-- 3. Verify - should show only 1 cart with 0 items
SELECT 
  d.madonhang,
  d.makhachhang,
  d.ngaydathang,
  d.trangthaidonhang,
  COUNT(c.machitietdonhang) as item_count
FROM donhang d
LEFT JOIN chitietdonhang c ON d.madonhang = c.madonhang
WHERE d.makhachhang = 11
AND d.trangthaidonhang = 'cart'
GROUP BY d.madonhang, d.makhachhang, d.ngaydathang, d.trangthaidonhang;
