# Shop Thời Trang - Hướng dẫn API Integration

## 📋 Tổng quan thay đổi

Đã cập nhật frontend để:
1. **Chỉ cho phép nhân viên đăng nhập** (bỏ lựa chọn khách hàng)
2. **Bỏ chức năng đăng ký** tại trang login
3. **Kết nối với API backend thật** thay vì dùng mock data

## 🔄 Các thay đổi chi tiết

### 1. LoginPage (`src/pages/LoginPage.jsx`)
**Thay đổi:**
- ❌ Bỏ lựa chọn loại tài khoản (Nhân viên / Khách hàng)
- ❌ Bỏ link "Đăng ký ngay"
- ✅ Chỉ đăng nhập cho nhân viên
- ✅ Cập nhật title: "Đăng nhập Quản trị - Dành cho Nhân viên"

**API Endpoint sử dụng:**
```
POST /api/auth/login/employee
Body: { tenDangNhap, matKhau }
Response: { token, user }
```

### 2. Service Layer - Kết nối API

Đã tạo 6 service files mới trong `src/services/`:

#### a) `nhanvienService.js`
```javascript
- getAll()          // GET /api/nhanvien
- getById(id)       // GET /api/nhanvien/:id
- create(data)      // POST /api/nhanvien
- update(id, data)  // PUT /api/nhanvien/:id
- delete(id)        // DELETE /api/nhanvien/:id
```

#### b) `sanphamService.js`
```javascript
- getAll()          // GET /api/sanpham
- getById(id)       // GET /api/sanpham/:id
- create(data)      // POST /api/sanpham
- update(id, data)  // PUT /api/sanpham/:id
- delete(id)        // DELETE /api/sanpham/:id
```

#### c) `donhangService.js`
```javascript
- getAll()                      // GET /api/donhang
- getById(id)                   // GET /api/donhang/:id
- getByCustomer(customerId)     // GET /api/donhang/khachhang/:makhachhang
- create(data)                  // POST /api/donhang
- update(id, data)              // PUT /api/donhang/:id
- delete(id)                    // DELETE /api/donhang/:id
```

#### d) `bannerService.js`
```javascript
- getAll()          // GET /api/banner
- getById(id)       // GET /api/banner/:id
- create(data)      // POST /api/banner
- update(id, data)  // PUT /api/banner/:id
- delete(id)        // DELETE /api/banner/:id
```

#### e) `calamviecService.js`
```javascript
- getAll()          // GET /api/calamviec
- getById(id)       // GET /api/calamviec/:id
- create(data)      // POST /api/calamviec
- update(id, data)  // PUT /api/calamviec/:id
- delete(id)        // DELETE /api/calamviec/:id
```

#### f) `khuyenmaiService.js`
```javascript
- getAll()          // GET /api/khuyenmai
- getById(id)       // GET /api/khuyenmai/:id
- create(data)      // POST /api/khuyenmai
- update(id, data)  // PUT /api/khuyenmai/:id
- delete(id)        // DELETE /api/khuyenmai/:id
```

### 3. Pages - Connect với API

#### a) `NhanVienPage.jsx` ✅
**Features:**
- Hiển thị danh sách nhân viên từ API
- Tìm kiếm theo tên, mã, email
- Xóa nhân viên (có confirm)
- Loading state
- Error handling

**Data mapping:**
```javascript
{
  maNhanVien: string,
  hoTen: string,
  email: string,
  soDienThoai: string,
  trangThai: 'active' | 'inactive'
}
```

#### b) `SanPhamPage.jsx` ✅
**Features:**
- Grid view sản phẩm từ API
- Tìm kiếm theo tên, mã sản phẩm
- Hiển thị giá bán và số lượng tồn kho
- Xóa sản phẩm (có confirm)
- Loading state & error handling

**Data mapping:**
```javascript
{
  maSanPham: string,
  tenSanPham: string,
  giaBan: number,
  soLuongTonKho: number
}
```

#### c) `DonHangPage.jsx` ✅
**Features:**
- Danh sách đơn hàng từ API
- Stats tự động tính (pending, shipping, completed, cancelled)
- Tìm kiếm theo mã đơn hàng, tên khách hàng
- Lọc theo trạng thái
- Format ngày tháng (dd/mm/yyyy)
- Loading state & error handling

**Data mapping:**
```javascript
{
  maDonHang: string,
  tenKhachHang: string,
  ngayDatHang: Date,
  tongTien: number,
  trangThai: 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled'
}
```

**Status mapping:**
- `pending` → Chờ xác nhận (yellow)
- `confirmed` → Đã xác nhận (blue)
- `shipping` → Đang giao (blue)
- `completed` → Hoàn thành (green)
- `cancelled` → Đã hủy (red)

#### d) `BannerPage.jsx` ✅
**Features:**
- Danh sách banner từ API
- Hiển thị hình ảnh (nếu có URL)
- Thứ tự và trạng thái
- Xóa banner (có confirm)
- Loading state & error handling

**Data mapping:**
```javascript
{
  maBanner: string,
  tieuDe: string,
  moTa: string,
  hinhAnh: string (URL),
  thuTu: number,
  trangThai: 'active' | 'inactive'
}
```

#### e) `CaLamViecPage.jsx` ✅
**Features:**
- Danh sách ca làm việc từ API
- Hiển thị giờ bắt đầu, kết thúc
- Xóa ca làm việc (có confirm)
- Loading state & error handling

**Data mapping:**
```javascript
{
  maCa: string,
  tenCa: string,
  gioBatDau: string (HH:mm),
  gioKetThuc: string (HH:mm),
  trangThai: 'active' | 'inactive'
}
```

#### f) `KhuyenMaiPage.jsx` ✅
**Features:**
- Grid view khuyến mãi từ API
- Hiển thị % giảm giá hoặc số tiền giảm
- Tự động tính trạng thái (active/scheduled/expired) dựa vào ngày
- Format ngày tháng (dd/mm/yyyy)
- Xóa khuyến mãi (có confirm)
- Loading state & error handling

**Data mapping:**
```javascript
{
  maKhuyenMai: string,
  tenKhuyenMai: string,
  phanTramGiam: number (0-100),
  soTienGiam: number,
  ngayBatDau: Date,
  ngayKetThuc: Date
}
```

**Status logic:**
- `active` → Đang diễn ra (green) - now >= start && now <= end
- `scheduled` → Sắp diễn ra (yellow) - now < start
- `expired` → Đã kết thúc (gray) - now > end

## 🔧 Common Features trong tất cả Pages

### 1. Loading State
```javascript
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Đang tải...</div>
    </div>
  );
}
```

### 2. Error Handling
```javascript
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
    {error}
  </div>
)}
```

### 3. Empty State
```javascript
{items.length === 0 ? (
  <div className="text-center py-12 text-gray-500">
    {searchTerm ? 'Không tìm thấy...' : 'Chưa có dữ liệu'}
  </div>
) : (
  // Render data
)}
```

### 4. Delete Confirmation
```javascript
const handleDelete = async (id) => {
  if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
  
  try {
    await service.delete(id);
    fetchData(); // Reload
  } catch (err) {
    alert('Không thể xóa');
  }
};
```

## 📊 Database Field Naming Convention

Backend API trả về dữ liệu với **camelCase** naming:

| Loại | Ví dụ |
|------|-------|
| Mã | `maNhanVien`, `maSanPham`, `maDonHang` |
| Tên | `tenSanPham`, `tenKhuyenMai`, `tenCa` |
| Ngày | `ngayBatDau`, `ngayKetThuc`, `ngayDatHang` |
| Trạng thái | `trangThai` ('active' / 'inactive') |
| Số lượng | `soLuongTonKho`, `soTienGiam` |
| Giá | `giaBan`, `tongTien` |

## 🚀 Cách test kết nối API

### 1. Chạy Backend
```bash
cd d:\shopthoitrang\shopthoitrang-server
npm start
```
Server chạy tại: http://localhost:3000

### 2. Chạy Frontend
```bash
cd d:\shopthoitrang\shopthoitrang-web
npm run dev
```
Frontend chạy tại: http://localhost:5173

### 3. Test Login
1. Truy cập http://localhost:5173
2. Nhập username và password của nhân viên
3. Kiểm tra Network tab (F12) → Tab Network
4. Xem request POST `/api/auth/login/employee`
5. Kiểm tra response có token và user data

### 4. Test các trang
- `/dashboard` - Tổng quan
- `/nhanvien` - Danh sách nhân viên từ Supabase
- `/sanpham` - Danh sách sản phẩm từ Supabase
- `/donhang` - Danh sách đơn hàng từ Supabase
- `/banner` - Danh sách banner từ Supabase
- `/calamviec` - Danh sách ca làm việc từ Supabase
- `/khuyenmai` - Danh sách khuyến mãi từ Supabase

### 5. Kiểm tra Console
```javascript
// Mở Chrome DevTools (F12) → Console tab
// Xem có lỗi nào không

// Thử gọi API trực tiếp:
fetch('http://localhost:3000/api/nhanvien', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
}).then(r => r.json()).then(console.log);
```

## ⚠️ Troubleshooting

### Lỗi 401 Unauthorized
- **Nguyên nhân:** Token không hợp lệ hoặc hết hạn
- **Giải pháp:** Đăng xuất và đăng nhập lại

### Lỗi CORS
- **Nguyên nhân:** Backend chưa cấu hình CORS
- **Giải pháp:** Đảm bảo backend có `app.use(cors())`

### Lỗi Network Error
- **Nguyên nhân:** Backend không chạy
- **Giải pháp:** Chạy `npm start` trong thư mục server

### Data không hiển thị
- **Nguyên nhân:** 
  1. Database chưa có dữ liệu
  2. Field names không khớp
- **Giải pháp:**
  1. Thêm dữ liệu vào Supabase
  2. Kiểm tra console.log(data) để xem structure

## 📝 Ghi chú

- ✅ Tất cả pages đã connect với API thật
- ✅ Loading states và error handling đầy đủ
- ✅ Search và filter working
- ✅ Delete với confirmation
- ⏳ TODO: Implement Create/Edit forms (Modal hoặc separate pages)
- ⏳ TODO: Image upload cho sản phẩm và banner
- ⏳ TODO: Pagination cho danh sách dài

## 🎯 Next Steps

1. **Tạo Forms cho CRUD:**
   - Modal components cho Create/Edit
   - Form validation
   - Success/Error notifications

2. **Upload hình ảnh:**
   - Integrate với Supabase Storage
   - Image preview trước khi upload

3. **Pagination:**
   - Implement pagination component
   - Add limit/offset to API calls

4. **Real-time updates:**
   - Sử dụng Supabase Realtime
   - Auto-refresh khi có thay đổi
