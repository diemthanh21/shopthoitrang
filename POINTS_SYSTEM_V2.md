# Tài liệu triển khai hệ thống tích điểm V2

## Tổng quan
Hệ thống tích điểm mới loại bỏ hạng thẻ (Bạc, Vàng, Kim Cương) và chỉ tập trung vào **tích điểm thuần túy**. Điểm sẽ được reset về 0 khi hết hạn đúng 1 năm.

## Luồng tích điểm 7 ngày

### 1. Khi đơn hàng "Đã giao thành công"
- **KHÔNG** cộng điểm ngay vào `diem_hien_tai`
- Tạo bản ghi trong bảng `thethanhvien_point_transactions` với:
  - `status = 'PENDING'`
  - `available_at` = ngày giao + 7 ngày
  - `diem` = số điểm tính được (1,000 VND = 1 điểm)
- Cộng vào `diem_pending` của thẻ thành viên
- Hiển thị cho khách: **"Bạn sẽ nhận X điểm vào ngày dd/MM (sau 7 ngày)"**

### 2. Trong 7 ngày chờ
#### Không có trả/đổi/hủy
- Giữ nguyên `status = 'PENDING'`
- Điểm vẫn hiển thị trong danh sách "Điểm chờ duyệt"

#### Có trả/đổi hàng
**Trả toàn bộ:**
- Hủy tất cả pending points: `status = 'CANCELLED'`
- Trừ `diem_pending` về 0

**Trả một phần:**
- Tính lại điểm theo giá trị còn lại
- Cập nhật `diem` trong transaction
- Điều chỉnh `diem_pending`

**Đổi ngang giá:**
- Giữ nguyên pending points

**Đổi chênh lệch:**
- Tăng/giảm pending points theo chênh tiền

### 3. Sau đủ 7 ngày
Job tự động (`scripts/approve-pending-points.js`) chạy:

**Kiểm tra:**
- Đơn hàng vẫn ở trạng thái "Đã giao / Hoàn thành"
- Không có trả/hủy

**Nếu OK:**
- Chuyển `status = 'PENDING'` → `'APPROVED'`
- Trừ `diem_pending`
- Cộng `diem_hien_tai` (điểm khả dụng)
- Cộng `diem_nam_hien_tai` (cho tracking năm)

**Nếu có vấn đề:**
- Chuyển `status = 'CANCELLED'`
- Trừ `diem_pending`

## Cấu trúc Database

### Bảng `thethanhvien` (V2)
```sql
CREATE TABLE thethanhvien (
  mathe integer PRIMARY KEY,
  makhachhang integer NOT NULL,
  ngaycap timestamp,
  trangthai boolean DEFAULT true,
  
  -- Điểm tích lũy
  diem_hien_tai numeric DEFAULT 0,    -- Điểm khả dụng (đã duyệt)
  diem_pending numeric DEFAULT 0,      -- Điểm chờ duyệt (7 ngày)
  diem_nam_hien_tai numeric DEFAULT 0, -- Điểm trong năm (reset hàng năm)
  
  nam_diem integer,                    -- Năm tracking hiện tại
  last_reset_at timestamp,             -- Lần reset cuối
  updated_at timestamp
);
```

**Lưu ý:** 
- Đã XÓA: `mahangthe`, `tier_snapshot`, `tichluy_khi_cap`
- Mỗi khách hàng chỉ có 1 thẻ active (`UNIQUE INDEX` trên `makhachhang WHERE trangthai = true`)

### Bảng `thethanhvien_point_transactions`
```sql
CREATE TABLE thethanhvien_point_transactions (
  id bigint PRIMARY KEY,
  mathe integer NOT NULL,
  makhachhang integer NOT NULL,
  madonhang integer,
  
  type text NOT NULL,              -- 'EARN' | 'SPEND' | 'ADJUST' | 'RETURN' | 'EXCHANGE'
  diem numeric NOT NULL,           -- Số điểm (dương = tích, âm = trừ)
  status text NOT NULL,            -- 'PENDING' | 'APPROVED' | 'CANCELLED'
  
  ngaytao timestamptz,
  available_at timestamptz,        -- Ngày có thể dùng (EARN: +7 ngày)
  approved_at timestamptz,         -- Ngày thực tế được duyệt
  
  note text,
  metadata jsonb,                  -- Thông tin thêm
  created_at timestamptz,
  updated_at timestamptz
);
```

## API Endpoints

### 1. Lấy thông tin điểm
```http
GET /api/membership/:makhachhang/points
Authorization: Bearer {token}
```

**Response:**
```json
{
  "diem_hien_tai": 150,
  "diem_pending": 50,
  "diem_nam_hien_tai": 200,
  "nam_diem": 2025,
  "last_reset_at": "2025-01-01T00:00:00Z",
  "pending_transactions": [
    {
      "diem": 25,
      "madonhang": 123,
      "available_at": "2025-11-28T10:00:00Z",
      "note": "Tích điểm đơn #123"
    }
  ]
}
```

### 2. Lịch sử giao dịch điểm
```http
GET /api/membership/:makhachhang/point-history?limit=50
Authorization: Bearer {token}
```

### 3. Duyệt điểm pending (Admin/Job)
```http
POST /api/membership/approve-pending-points
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Da chuyen diem cho sang diem su dung",
  "released": 10,
  "cancelled": 2
}
```

### 4. Điều chỉnh điểm pending (Trả/đổi hàng)
```http
POST /api/membership/adjust-pending
Authorization: Bearer {token}
Content-Type: application/json

{
  "madonhang": 123,
  "adjustment_amount": -50000,
  "reason": "Trả hàng một phần"
}
```

## Scheduled Job

### Chạy job duyệt điểm

**Manual:**
```bash
node scripts/approve-pending-points.js
```

**Cron (Linux):**
```bash
# Chạy mỗi ngày lúc 2:00 sáng
0 2 * * * cd /path/to/shopthoitrang-server && node scripts/approve-pending-points.js >> /var/log/approve-points.log 2>&1
```

**Task Scheduler (Windows):**
1. Tạo task mới
2. Trigger: Daily, 2:00 AM
3. Action: Start program
4. Program: `node.exe`
5. Arguments: `scripts/approve-pending-points.js`
6. Start in: `D:\shopthoitrang\shopthoitrang-server`

**API Trigger (Alternative):**
- Tạo endpoint protected bằng admin auth
- Call từ external cron service (cron-job.org, etc.)

## Mobile Implementation

### 1. Màn hình thẻ thành viên
File: `lib/screens/membership_card_screen_v2.dart`

**Hiển thị:**
- Điểm khả dụng (lớn, nổi bật)
- Điểm chờ duyệt với danh sách chi tiết + ngày duyệt
- Điểm tích lũy trong năm
- Hướng dẫn sử dụng điểm

### 2. Checkout Screen
**TODO:** Thêm section sử dụng điểm

```dart
// Thêm vào state
PointsSummary? _pointsSummary;
double _pointsToUse = 0;

// Load điểm khả dụng
Future<void> _loadPoints() async {
  final points = await _membershipService.getPointsSummary(maKhachHang);
  setState(() => _pointsSummary = points);
}

// Build UI section
Widget _buildPointsSection() {
  final availablePoints = _pointsSummary?.diemHienTai ?? 0;
  final pointsValue = _pointsToUse * 1000; // 1 điểm = 1,000 VND
  
  return Container(
    child: Column(
      children: [
        Text('Điểm khả dụng: ${availablePoints.toInt()}'),
        Slider(
          value: _pointsToUse,
          min: 0,
          max: math.min(availablePoints, _totalAmount / 1000),
          onChanged: (value) => setState(() => _pointsToUse = value),
        ),
        Text('Sử dụng: ${_pointsToUse.toInt()} điểm'),
        Text('Giảm: ${_formatCurrency(pointsValue)}'),
      ],
    ),
  );
}

// Tính tổng tiền
double get _grandTotal {
  final pointsDiscount = _pointsToUse * 1000;
  return max(0, _totalAmount - _orderCouponDiscount - pointsDiscount) +
         max(0, _shippingFee - _shippingCouponDiscount);
}

// Khi đặt hàng
final order = Order(
  // ... các field khác
  pointsUsed: _pointsToUse.toInt(),
);
```

## Admin Web Interface

### TODO: Trang quản lý điểm

**File:** `shopthoitrang-web/src/pages/AdminPointsManagement.jsx`

**Tính năng:**
1. Danh sách khách hàng với điểm hiện tại/pending
2. Xem chi tiết giao dịch điểm theo khách hàng
3. Trigger manual approve pending points
4. Thống kê: tổng điểm đang lưu hành, pending, đã sử dụng
5. Export báo cáo điểm

**Component mẫu:**
```jsx
<div className="points-management">
  <div className="stats-cards">
    <Card title="Tổng điểm lưu hành" value={totalActivePoints} />
    <Card title="Điểm chờ duyệt" value={totalPendingPoints} />
    <Card title="Đã sử dụng (tháng)" value={spentThisMonth} />
  </div>
  
  <DataTable
    columns={['Khách hàng', 'Điểm hiện tại', 'Pending', 'Năm', 'Hành động']}
    data={customers}
    onRowClick={showCustomerPointHistory}
  />
  
  <Button onClick={triggerApprovePoints}>
    Duyệt điểm pending ngay
  </Button>
</div>
```

## Testing Checklist

### Backend
- [ ] Tạo thẻ thành viên tự động khi đăng ký
- [ ] Tạo pending points khi đơn "Đã giao"
- [ ] Job duyệt điểm sau 7 ngày
- [ ] Điều chỉnh pending khi trả/đổi hàng
- [ ] Trừ điểm khi sử dụng tại checkout
- [ ] Reset điểm hàng năm

### Mobile
- [ ] Hiển thị điểm hiện tại, pending, năm
- [ ] Danh sách pending với ngày duyệt
- [ ] Sử dụng điểm tại checkout
- [ ] Cập nhật điểm realtime sau mua hàng

### Admin Web
- [ ] Xem danh sách điểm tất cả khách hàng
- [ ] Chi tiết lịch sử điểm
- [ ] Trigger approve manual
- [ ] Export báo cáo

## Migration Steps

### Bước 1: Backup dữ liệu cũ
```sql
CREATE TABLE thethanhvien_backup AS 
SELECT * FROM public.thethanhvien;

CREATE TABLE hangthe_backup AS 
SELECT * FROM public.hangthe;
```

### Bước 2: Chạy migration
```bash
psql -U postgres -d shopthoitrang -f sql/2025-11-membership-points-v2.sql
```

### Bước 3: Deploy server
```bash
cd shopthoitrang-server
npm install
pm2 restart shopthoitrang-server
```

### Bước 4: Setup cron job
```bash
crontab -e
# Thêm dòng:
0 2 * * * cd /path/to/server && node scripts/approve-pending-points.js
```

### Bước 5: Deploy mobile
```bash
cd shopthoitrang-mobile
flutter build apk --release
# Upload APK lên CH Play hoặc distribute
```

### Bước 6: Deploy web admin
```bash
cd shopthoitrang-web
npm run build
# Deploy build folder
```

## Lưu ý quan trọng

1. **Không xóa bảng `hangthe`** ngay - giữ lại để fallback nếu cần
2. **Monitor job duyệt điểm** - setup alerting nếu job fail
3. **Rate limit** cho API endpoints điểm (tránh spam)
4. **Validate** số điểm sử dụng không vượt quá khả dụng
5. **Transaction** khi trừ điểm - đảm bảo atomic
6. **Index** cho query performance (đã có trong migration)

## Troubleshooting

### Job không chạy tự động
- Kiểm tra cron service: `systemctl status cron`
- Xem logs: `/var/log/approve-points.log`
- Test manual: `node scripts/approve-pending-points.js`

### Điểm pending không được duyệt
- Kiểm tra `available_at` đã qua 7 ngày chưa
- Xem status đơn hàng có phải "Đã giao" không
- Check logs job

### Điểm bị trừ nhầm
- Xem lịch sử trong `point_transactions`
- Có thể ADJUST bằng API `/adjust-pending`

## Tài liệu tham khảo

- Database schema: `sql/2025-11-membership-points-v2.sql`
- Service layer: `src/services/membership.service.js`
- Repository: `src/repositories/point_transaction.repository.js`
- Mobile models: `lib/models/membership_model.dart`
- Mobile UI: `lib/screens/membership_card_screen_v2.dart`
