# Lịch Sử Đơn Hàng - Order History Logging

## Tính năng

Tự động ghi log mỗi khi:
- Nhân viên thay đổi trạng thái đơn hàng
- Nhân viên duyệt đơn hàng (chuyển từ "Chờ xác nhận" → "Chờ lấy hàng")
- Đơn hàng bị hủy (lưu lý do hủy)

## Database Migration

Chạy file SQL để tạo bảng:

```bash
# Trên Supabase SQL Editor hoặc psql
psql -h your-db-host -U postgres -d your-database -f sql/2025-11-lichsudonhang.sql
```

Hoặc copy nội dung `sql/2025-11-lichsudonhang.sql` vào Supabase SQL Editor và chạy.

## Bảng lichsudonhang

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | SERIAL | Primary key |
| madonhang | INTEGER | Mã đơn hàng (FK to donhang) |
| manhanvien | INTEGER | Mã nhân viên thực hiện thay đổi (FK to nhanvien) |
| trangthaicu | VARCHAR(50) | Trạng thái cũ |
| trangthaimoi | VARCHAR(50) | Trạng thái mới |
| ghichu | TEXT | Lý do hủy, ghi chú thêm |
| thoigian | TIMESTAMP | Thời điểm thay đổi |

## API Endpoints

### 1. Lấy lịch sử của 1 đơn hàng
```
GET /api/lichsudonhang/order/:madonhang
```

Response:
```json
[
  {
    "id": 1,
    "madonhang": 123,
    "manhanvien": 5,
    "trangthaicu": "Chờ xác nhận",
    "trangthaimoi": "Chờ lấy hàng",
    "ghichu": null,
    "thoigian": "2025-11-22T10:30:00Z"
  },
  {
    "id": 2,
    "madonhang": 123,
    "manhanvien": 5,
    "trangthaicu": "Chờ lấy hàng",
    "trangthaimoi": "Đang giao",
    "ghichu": null,
    "thoigian": "2025-11-22T14:00:00Z"
  }
]
```

### 2. Lấy tất cả lịch sử (có filter)
```
GET /api/lichsudonhang?madonhang=123
GET /api/lichsudonhang?manhanvien=5
GET /api/lichsudonhang?from=2025-11-01&to=2025-11-30
```

## Frontend Service

```js
import lichsudonhangService from '../services/lichsudonhangService';

// Lấy lịch sử của 1 đơn
const history = await lichsudonhangService.getByOrder(123);

// Lấy tất cả log của 1 nhân viên
const employeeLogs = await lichsudonhangService.getAll({ manhanvien: 5 });
```

## UI Display

Lịch sử được hiển thị trong **Order Detail Drawer** (chi tiết đơn hàng) ở trang quản lý đơn hàng admin.

Bảng lịch sử gồm:
- ⏰ Thời gian thay đổi
- 👤 Nhân viên thực hiện (mã - tên)
- 📊 Trạng thái cũ → Trạng thái mới
- 📝 Ghi chú (lý do hủy, v.v.)

## Backend Service

Service tự động được gọi trong `donhang.service.js` mỗi khi:
1. Trạng thái đơn hàng thay đổi
2. Nhân viên duyệt được gán vào đơn
3. Đơn hàng bị hủy (lưu lý do)

```js
// Trong donhang.service.js
if (statusChanged || employeeChanged || payload.lydohuy) {
  await lichSuService.logStatusChange({
    madonhang: id,
    manhanvien: updated.manhanvien || payload.manhanvien || null,
    trangthaicu: existing?.trangthaidonhang || null,
    trangthaimoi: updated.trangthaidonhang || null,
    ghichu: payload.lydohuy || null,
  });
}
```

## Lưu ý

- Log errors không làm gián đoạn flow update đơn hàng (try-catch wrapped)
- Index được tạo cho các cột thường xuyên query (madonhang, manhanvien, thoigian)
- Cascade delete: khi xóa đơn hàng thì lịch sử cũng bị xóa
- Nhân viên bị xóa → manhanvien được set NULL (vẫn giữ log)
