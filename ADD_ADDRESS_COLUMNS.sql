-- Migration: Thêm các cột mới cho bảng diachikhachhang
-- Giữ cột diachi cũ cho backward compatibility

-- Thêm các cột mới
ALTER TABLE diachikhachhang
ADD COLUMN IF NOT EXISTS ten VARCHAR(100),
ADD COLUMN IF NOT EXISTS sodienthoai VARCHAR(15),
ADD COLUMN IF NOT EXISTS tinh VARCHAR(100),
ADD COLUMN IF NOT EXISTS phuong VARCHAR(100),
ADD COLUMN IF NOT EXISTS diachicuthe VARCHAR(255),
ADD COLUMN IF NOT EXISTS macdinh BOOLEAN DEFAULT FALSE;

-- Tạo index để tìm kiếm nhanh hơn
CREATE INDEX IF NOT EXISTS idx_diachikhachhang_makhachhang 
ON diachikhachhang(makhachhang);

CREATE INDEX IF NOT EXISTS idx_diachikhachhang_macdinh 
ON diachikhachhang(makhachhang, macdinh) 
WHERE macdinh = TRUE;

-- Migration dữ liệu cũ: Parse string diachi cũ sang các cột mới
-- Format cũ: "Tên | SĐT | Tỉnh, Phường | Địa chỉ cụ thể"
UPDATE diachikhachhang
SET 
  ten = TRIM(SPLIT_PART(diachi, '|', 1)),
  sodienthoai = TRIM(SPLIT_PART(diachi, '|', 2)),
  tinh = TRIM(SPLIT_PART(SPLIT_PART(diachi, '|', 3), ',', 1)),
  phuong = TRIM(SPLIT_PART(SPLIT_PART(diachi, '|', 3), ',', 2)),
  diachicuthe = TRIM(SPLIT_PART(diachi, '|', 4))
WHERE ten IS NULL 
  AND diachi IS NOT NULL 
  AND diachi LIKE '%|%|%|%';

-- Thêm comment cho các cột
COMMENT ON COLUMN diachikhachhang.ten IS 'Họ và tên người nhận';
COMMENT ON COLUMN diachikhachhang.sodienthoai IS 'Số điện thoại người nhận';
COMMENT ON COLUMN diachikhachhang.tinh IS 'Tỉnh/Thành phố (34 tỉnh mới)';
COMMENT ON COLUMN diachikhachhang.phuong IS 'Phường/Xã (sau sát nhập)';
COMMENT ON COLUMN diachikhachhang.diachicuthe IS 'Số nhà, tên đường';
COMMENT ON COLUMN diachikhachhang.macdinh IS 'Địa chỉ mặc định của khách hàng';
COMMENT ON COLUMN diachikhachhang.diachi IS 'Địa chỉ dạng string (backward compatibility)';
