# Discount Code Usage Tracking

## Tổng quan
Hệ thống đã được cập nhật để lưu lịch sử sử dụng mã giảm giá khi khách hàng đặt hàng.

## Thay đổi Database

### 1. Bảng `magiamgia_sudung` (mới)
```sql
CREATE TABLE magiamgia_sudung (
    id SERIAL PRIMARY KEY,
    magiamgia VARCHAR(50) REFERENCES magiamgia(magiamgia),
    makhachhang INTEGER REFERENCES taikhoankhachhang(makhachhang),
    madonhang INTEGER REFERENCES donhang(madonhang),
    ngaysudung TIMESTAMPTZ DEFAULT NOW(),
    sotiengiamgia DECIMAL(15, 2) DEFAULT 0
);
```

**Mục đích**: Lưu lịch sử mỗi lần khách hàng sử dụng mã giảm giá.

**Chạy migration**:
```bash
psql -U username -d database < sql/2025-11-23-magiamgia-sudung.sql
```

### 2. Thêm cột `magiamgia` vào bảng `donhang`
```sql
ALTER TABLE donhang ADD COLUMN magiamgia TEXT;
```

**Mục đích**: Lưu mã giảm giá đã dùng trực tiếp trong đơn hàng (hỗ trợ nhiều mã, phân cách bằng dấu phẩy).

**Chạy migration**:
```bash
psql -U username -d database < sql/2025-11-23-donhang-add-magiamgia.sql
```

## Thay đổi Backend

### File: `donhang.service.js`

#### 1. Lưu mã giảm giá vào `donhang.magiamgia`
```javascript
const discountCodesStr = body.magiamgia 
  ? (Array.isArray(body.magiamgia) ? body.magiamgia.join(',') : String(body.magiamgia))
  : null;

const basePayload = {
  // ...other fields
  magiamgia: discountCodesStr,
};
```

#### 2. Lưu lịch sử sử dụng vào `magiamgia_sudung`
```javascript
// Sau khi tạo đơn hàng thành công
const codes = String(discountCodes).split(/[,|]/).map(c => c.trim()).filter(c => c);
const usageRecords = codes.map((code, index) => ({
  magiamgia: code,
  makhachhang: body.makhachhang,
  madonhang: order.madonhang,
  ngaysudung: new Date().toISOString(),
  sotiengiamgia: discountAmounts[index] || 0,
}));

await supabase.from('magiamgia_sudung').insert(usageRecords);
```

#### 3. Hiển thị discount code trên web admin
Backend đã hỗ trợ lấy thông tin mã giảm giá từ `donhang.magiamgia`:
```javascript
if (orderJson.magiamgia) {
  const codes = String(orderJson.magiamgia).split(/[|,]/).map(c => c.trim());
  // Query magiamgia table for details
  // Return maGiamGiaInfo or maGiamGiaInfoList
}
```

## Thay đổi Mobile App

### File: `order_model.dart`

Thêm fields mới:
```dart
final List<String> discountCodes;
final List<double> discountAmounts;

// Serialize to JSON
'magiamgia': discountCodes.join(','),
'discountAmounts': discountAmounts,
```

### File: `checkout_screen.dart`

Tính toán và gửi mã giảm giá:
```dart
final discountCodes = <String>[];
final discountAmounts = <double>[];

if (_selectedDiscountCoupon != null) {
  discountCodes.add(_selectedDiscountCoupon!.code);
  discountAmounts.add(_orderCouponDiscount);
}
if (_selectedFreeshipCoupon != null) {
  discountCodes.add(_selectedFreeshipCoupon!.code);
  discountAmounts.add(_shippingCouponDiscount);
}

final order = Order(
  // ...other fields
  discountCodes: discountCodes,
  discountAmounts: discountAmounts,
);
```

## Thay đổi Web Admin

### File: `DonHangPage.jsx`

#### 1. Hiển thị mã giảm giá chi tiết
```jsx
{(order.maGiamGiaInfo || order.maGiamGiaInfoList || order.totalDiscount > 0) && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg">
    {/* Chi tiết mã giảm giá */}
  </div>
)}
```

#### 2. Hiển thị trong payment footer
```jsx
{order.maGiamGiaInfo && (
  <tr className="text-red-600">
    <td colSpan={4}>Giảm giá đơn hàng<br/>{order.maGiamGiaInfo.magiamgia}</td>
    <td>-{fmtCurrency(discountAmount)}</td>
  </tr>
)}
```

#### 3. Xử lý đơn hàng cũ không có mã giảm giá
Backend tự động tính `totalDiscount` cho các đơn hàng cũ:
```javascript
if (!orderJson.maGiamGiaInfo && !orderJson.maGiamGiaInfoList) {
  const calculatedDiscount = orderJson.subtotal + shipping - orderJson.thanhtien;
  if (calculatedDiscount > 0) {
    orderJson.totalDiscount = calculatedDiscount;
  }
}
```

## Luồng hoạt động

### 1. Khách hàng đặt hàng (Mobile)
1. Chọn mã giảm giá trong checkout
2. App tính toán số tiền giảm cho từng mã
3. Gửi đơn hàng với `discountCodes` và `discountAmounts`

### 2. Backend xử lý
1. Lưu `magiamgia` vào bảng `donhang`
2. Tạo chi tiết đơn hàng
3. Lưu lịch sử sử dụng vào `magiamgia_sudung`
4. Trừ điểm membership (nếu có)
5. Trả về thông tin đơn hàng

### 3. Admin xem đơn hàng (Web)
1. Backend query `donhang.magiamgia`
2. Lấy chi tiết từ bảng `magiamgia`
3. Trả về `maGiamGiaInfo` hoặc `maGiamGiaInfoList`
4. Frontend hiển thị chi tiết mã giảm giá

### 4. Đơn hàng cũ
- Không có `magiamgia` field
- Backend tính `totalDiscount` từ `subtotal`, `shipping`, `thanhtien`
- Frontend hiển thị "Giảm giá đơn hàng (Đơn hàng cũ)"

## Query hữu ích

### Lịch sử sử dụng mã giảm giá của khách hàng
```sql
SELECT 
  mgs.*,
  mg.tenchuongtrinh,
  dh.ngaydathang,
  dh.thanhtien
FROM magiamgia_sudung mgs
JOIN magiamgia mg ON mgs.magiamgia = mg.magiamgia
JOIN donhang dh ON mgs.madonhang = dh.madonhang
WHERE mgs.makhachhang = ?
ORDER BY mgs.ngaysudung DESC;
```

### Thống kê mã giảm giá được dùng nhiều nhất
```sql
SELECT 
  magiamgia,
  COUNT(*) as so_lan_su_dung,
  SUM(sotiengiamgia) as tong_tien_giam
FROM magiamgia_sudung
GROUP BY magiamgia
ORDER BY so_lan_su_dung DESC;
```

### Tìm đơn hàng có dùng mã giảm giá
```sql
SELECT * FROM donhang 
WHERE magiamgia IS NOT NULL AND magiamgia != ''
ORDER BY ngaydathang DESC;
```

## Testing

### 1. Test mobile đặt hàng
```dart
// Checkout với mã giảm giá
// Kiểm tra console log backend:
// [DonHangService.create] Saving discount code usage for order X: [CODE1, CODE2]
```

### 2. Test web admin xem đơn
```javascript
// Kiểm tra console log frontend:
// [OrderDetail Debug] Order data: { maGiamGiaInfo: {...} }
```

### 3. Test database
```sql
-- Kiểm tra đơn hàng vừa tạo
SELECT madonhang, makhachhang, magiamgia, thanhtien FROM donhang ORDER BY madonhang DESC LIMIT 5;

-- Kiểm tra lịch sử sử dụng
SELECT * FROM magiamgia_sudung ORDER BY ngaysudung DESC LIMIT 10;
```

## Lưu ý
- Hệ thống hỗ trợ nhiều mã giảm giá cho 1 đơn hàng (phân cách bằng dấu phẩy)
- Nếu lưu lịch sử thất bại, đơn hàng vẫn được tạo thành công
- Đơn hàng cũ không có thông tin mã giảm giá chi tiết, chỉ hiển thị tổng giảm giá
- RLS policies đã được thiết lập cho bảng `magiamgia_sudung`
