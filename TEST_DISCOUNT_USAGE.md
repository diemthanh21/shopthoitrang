# Test Discount Usage Tracking

## ✅ Đã sửa xong:

### Backend (`donhang.service.js`)
- ✅ Đổi từ `magiamgia` (string) sang `mavoucher` (integer ID)
- ✅ Đổi từ `ngaysudung` sang `ngay_su_dung`
- ✅ Lấy `voucher_ids` từ body (mobile đã gửi sẵn)
- ✅ Insert vào bảng `magiamgia_sudung` đúng format

### Mobile
- ✅ Đã gửi `appliedVoucherIds` (integer array) trong Order
- ✅ Serialize thành `voucher_ids` khi gửi API
- ✅ Bỏ code thừa `discountCodes` và `discountAmounts`

## 🧪 Test luồng:

1. **Mobile đặt hàng với mã giảm giá**
   - Chọn 1 hoặc nhiều voucher
   - `_collectVoucherIds()` trả về array of voucher IDs
   - Gửi lên backend trong field `voucher_ids`

2. **Backend xử lý**
   ```javascript
   // Log sẽ hiển thị:
   [DonHangService.create] Checking voucher IDs: {
     voucher_ids: [10, 11],
     final: [10, 11]
   }
   
   // Insert records:
   {
     mavoucher: 10,
     makhachhang: 11,
     madonhang: 279,
     ngay_su_dung: "2025-11-23T..."
   }
   ```

3. **Kiểm tra database**
   ```sql
   SELECT * FROM magiamgia_sudung 
   ORDER BY ngay_su_dung DESC 
   LIMIT 10;
   ```

## 📝 Cấu trúc bảng `magiamgia_sudung`:

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| mavoucher | INTEGER | ID của voucher (FK to magiamgia.id) |
| makhachhang | INTEGER | ID khách hàng |
| madonhang | INTEGER | ID đơn hàng |
| ngay_su_dung | TIMESTAMPTZ | Thời gian sử dụng |

## ⚠️ Lưu ý:
- Backend đang dùng service role key → bỏ qua RLS
- Nếu insert lỗi, đơn hàng vẫn được tạo thành công
- Log chi tiết có thể xem trong terminal backend
