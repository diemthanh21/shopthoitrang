-- Kiểm tra dữ liệu địa chỉ trong database

-- Xem structure của bảng diachikhachhang
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'diachikhachhang'
ORDER BY ordinal_position;

-- Xem tất cả địa chỉ và kiểm tra format
SELECT 
    madiachikhachhang,
    makhachhang,
    ten,
    sodienthoai,
    tinh,
    phuong,
    diachicuthe,
    diachi,
    macdinh
FROM diachikhachhang
LIMIT 10;

-- Kiểm tra địa chỉ cụ thể có dữ liệu format mới không
SELECT 
    madiachikhachhang,
    CASE 
        WHEN ten IS NOT NULL AND ten != '' THEN 'Có tên'
        ELSE 'Không có tên'
    END as check_ten,
    CASE 
        WHEN sodienthoai IS NOT NULL AND sodienthoai != '' THEN 'Có SĐT'
        ELSE 'Không có SĐT'
    END as check_sdt,
    CASE 
        WHEN tinh IS NOT NULL AND tinh != '' THEN 'Có tỉnh'
        ELSE 'Không có tỉnh'
    END as check_tinh,
    CASE 
        WHEN diachi IS NOT NULL AND diachi != '' THEN 'Có địa chỉ cũ'
        ELSE 'Không có địa chỉ cũ'
    END as check_diachi_cu
FROM diachikhachhang;
