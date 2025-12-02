# Hệ Thống Thông Báo Chốt Ca - Hướng Dẫn Cài Đặt

## Tổng Quan
Hệ thống thông báo giúp quản lý nhận thông báo khi nhân viên gửi chốt ca, và nhân viên nhận thông báo khi quản lý duyệt/từ chối.

## Các Thành Phần Đã Hoàn Thiện

### 1. Backend (✅ Hoàn Thành)
- **File**: `src/controllers/systemlog.controller.js`
  - Thêm function `createChotCaLog()` để ghi log thông báo
  - Cập nhật `list()` để lấy thông báo từ `chotca_log`

- **File**: `src/services/chotca.service.js`
  - Tự động tạo thông báo khi nhân viên tạo chốt ca
  - Tự động tạo thông báo khi quản lý duyệt/từ chối

### 2. Frontend (✅ Hoàn Thành)
- **File**: `src/layouts/DashboardLayout.jsx`
  - Hiển thị số lượng thông báo chưa đọc trên menu "Thông báo"
  - Realtime cập nhật khi có thông báo mới qua Supabase
  - Badge màu đỏ hiển thị số thông báo

- **File**: `src/pages/ThongBaoPage.jsx`
  - Giao diện hiển thị danh sách thông báo
  - Phân quyền xem thông báo (Manager vs Nhân viên)
  - Click vào thông báo để chuyển đến chi tiết

- **File**: `src/services/thongbaoService.js`
  - API gọi backend lấy danh sách thông báo
  - Đếm thông báo trong 24h gần nhất

### 3. Database (⚠️ Cần Thực Hiện)
- **Bảng**: `chotca_log`
  - Lưu lịch sử thông báo về chốt ca
  - Các trường: `id`, `machotca`, `action`, `note`, `actor_type`, `actor_id`, `created_at`

## Hướng Dẫn Cài Đặt

### Bước 1: Tạo Bảng Database

#### Cách 1: Chạy Script Tự Động (Khuyến Nghị)
```powershell
cd shopthoitrang-server
node scripts/create-chotca-log-table.js
```

#### Cách 2: Chạy SQL Thủ Công
Nếu script tự động không hoạt động, hãy:

1. Truy cập Supabase Dashboard
2. Vào **SQL Editor**
3. Copy và chạy SQL sau:

```sql
-- Tạo bảng chotca_log
CREATE TABLE IF NOT EXISTS chotca_log (
  id SERIAL PRIMARY KEY,
  machotca INTEGER NOT NULL REFERENCES chotca(machotca) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  note TEXT,
  actor_type VARCHAR(50),
  actor_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_chotca_log_machotca ON chotca_log(machotca);
CREATE INDEX IF NOT EXISTS idx_chotca_log_created_at ON chotca_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chotca_log_action ON chotca_log(action);
```

4. Kiểm tra bảng đã được tạo:
```sql
SELECT * FROM chotca_log LIMIT 1;
```

### Bước 2: Khởi Động Lại Server (Nếu Đang Chạy)
```powershell
# Trong thư mục shopthoitrang-server
# Dừng server hiện tại (Ctrl+C)
# Khởi động lại
npm start
```

### Bước 3: Khởi Động Lại Frontend (Nếu Đang Chạy)
```powershell
# Trong thư mục shopthoitrang-web
# Dừng server hiện tại (Ctrl+C)
# Khởi động lại
npm run dev
```

## Cách Sử Dụng

### Với Nhân Viên:
1. **Tạo chốt ca**: Vào menu Khác > Chốt ca, điền thông tin và gửi
2. **Nhận thông báo**: Khi quản lý duyệt/từ chối, badge thông báo sẽ hiện trên menu "Thông báo"
3. **Xem chi tiết**: Click vào menu Thông báo > Thông báo hệ thống

### Với Quản Lý:
1. **Nhận thông báo**: Khi nhân viên gửi chốt ca, badge thông báo sẽ hiện
2. **Xem và duyệt**: Click vào menu Thông báo > Thông báo hệ thống, sau đó vào chi tiết chốt ca để duyệt/từ chối

## Luồng Thông Báo

```
Nhân Viên Tạo Chốt Ca
    ↓
Backend ghi log: action = "CREATED"
    ↓
Quản Lý nhận thông báo (realtime)
    ↓
Quản Lý duyệt/từ chối
    ↓
Backend ghi log: action = "APPROVED" hoặc "REJECTED"
    ↓
Nhân Viên nhận thông báo (realtime)
```

## Kiểm Tra Thông Báo Realtime

### Test Flow:
1. **Mở 2 trình duyệt**:
   - Trình duyệt 1: Đăng nhập với tài khoản Nhân viên
   - Trình duyệt 2: Đăng nhập với tài khoản Quản lý

2. **Trình duyệt 1 (Nhân viên)**:
   - Tạo 1 chốt ca mới
   - Điền đầy đủ thông tin và gửi

3. **Trình duyệt 2 (Quản lý)**:
   - Kiểm tra menu "Thông báo" - badge số thông báo sẽ xuất hiện
   - Click vào "Thông báo hệ thống" để xem chi tiết
   - Vào chi tiết chốt ca và duyệt/từ chối

4. **Trình duyệt 1 (Nhân viên)**:
   - Badge thông báo sẽ cập nhật tự động
   - Vào "Thông báo hệ thống" để xem kết quả

## Troubleshooting

### Lỗi: "relation chotca_log does not exist"
**Nguyên nhân**: Bảng `chotca_log` chưa được tạo
**Giải pháp**: Chạy lại Bước 1 (tạo bảng database)

### Thông báo không hiện realtime
**Kiểm tra**:
1. Console trình duyệt có lỗi không?
2. Supabase Realtime đã được bật chưa? (Vào Supabase Dashboard > Database > Replication)
3. Thử refresh trang

### Badge không cập nhật số
**Kiểm tra**:
1. Xem Console có log "[DashboardLayout] New chotca_log event" không
2. Kiểm tra API `/system-logs` có trả dữ liệu không

## Các File Đã Thay Đổi

### Backend:
- ✅ `src/controllers/systemlog.controller.js`
- ✅ `src/services/chotca.service.js`

### Frontend:
- ✅ `src/layouts/DashboardLayout.jsx`
- ✅ `src/pages/ThongBaoPage.jsx`
- ✅ `src/services/thongbaoService.js`

### Scripts:
- ✅ `scripts/create-chotca-log-table.js`

### SQL:
- ✅ `CREATE_CHOTCA_LOG_TABLE.sql`

## Tính Năng Bổ Sung (Tùy Chọn)

Nếu muốn mở rộng hệ thống thông báo, có thể thêm:

1. **Mark as Read**: Đánh dấu đã đọc cho từng thông báo
2. **Filter**: Lọc theo loại thông báo, ngày tháng
3. **Push Notification**: Gửi thông báo browser/mobile
4. **Email Notification**: Gửi email khi có thông báo quan trọng
5. **Sound Alert**: Âm thanh khi có thông báo mới

---

**Phiên bản**: 1.0  
**Ngày tạo**: 2024  
**Tác giả**: GitHub Copilot
