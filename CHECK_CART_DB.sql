-- Kiểm tra giỏ hàng của user 11
-- Chạy các query này trong Supabase SQL Editor

-- 1. Tìm cart của user 11
SELECT * FROM donhang 
WHERE makhachhang = 11 
AND trangthaidonhang = 'cart'
ORDER BY ngaydathang DESC;

-- 2. Tìm items trong cart (thay [madonhang] bằng kết quả từ query 1)
SELECT * FROM chitietdonhang 
WHERE madonhang IN (56, 57, 58, 59, 60);

-- 3. Kiểm tra variant có tồn tại không
SELECT machitietsanpham, masanpham, mausac, kichthuoc, giaban, soluongton
FROM chitietsanpham 
WHERE machitietsanpham = 45;  -- Thay bằng variantId bạn đang thêm

-- 4. Kiểm tra RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('donhang', 'chitietdonhang')
ORDER BY tablename, policyname;

-- 5. Test insert trực tiếp
-- Nếu các query trên không có lỗi, thử insert thủ công:
INSERT INTO chitietdonhang (madonhang, machitietsanpham, soluong, dongia)
VALUES (60, 45, 1, 595000);
-- Nếu lỗi, xem error message để biết nguyên nhân
