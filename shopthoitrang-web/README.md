# Shop Thời Trang - Admin Dashboard

Giao diện quản lý cho hệ thống Shop Thời Trang được xây dựng bằng React + Vite + TailwindCSS.

## 🚀 Công nghệ sử dụng

- **React 18.3.1** - Thư viện UI
- **Vite 5.4.3** - Build tool và dev server
- **React Router 6.26.0** - Routing
- **TailwindCSS 3.4.10** - CSS framework
- **Axios 1.7.5** - HTTP client
- **Lucide React** - Icons

## 📦 Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Truy cập

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api-docs

## 🔐 Đăng nhập

### Tài khoản nhân viên
- URL: `/login`
- Chọn loại: **Nhân viên**
- Username: `admin` (hoặc tài khoản nhân viên trong database)
- Password: Mật khẩu tương ứng

### Tài khoản khách hàng
- URL: `/login`
- Chọn loại: **Khách hàng**
- Username: Tên đăng nhập khách hàng
- Password: Mật khẩu tương ứng

## 📂 Cấu trúc dự án

```
shopthoitrang-web/
├── src/
│   ├── components/         # Reusable components
│   │   └── ProtectedRoute.jsx
│   ├── contexts/           # React Context
│   │   └── AuthContext.jsx
│   ├── layouts/            # Layout components
│   │   └── DashboardLayout.jsx
│   ├── pages/              # Page components
│   │   ├── LoginPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── NhanVienPage.jsx
│   │   ├── SanPhamPage.jsx
│   │   ├── BannerPage.jsx
│   │   ├── CaLamViecPage.jsx
│   │   ├── KhuyenMaiPage.jsx
│   │   └── DonHangPage.jsx
│   ├── services/           # API services
│   │   ├── api.js          # Axios instance with interceptors
│   │   └── authService.js  # Authentication API calls
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── package.json
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # TailwindCSS configuration
└── postcss.config.js       # PostCSS configuration
```

## 🔑 Authentication Flow

1. **Login:**
   - User nhập username, password và chọn loại tài khoản
   - Frontend gọi `/api/auth/login/employee` hoặc `/api/auth/login/customer`
   - Backend trả về JWT token + user data
   - Token được lưu vào `localStorage`

2. **Protected Routes:**
   - Mọi route (trừ `/login`) đều được bảo vệ bởi `ProtectedRoute`
   - Component kiểm tra token trong `localStorage`
   - Nếu không có token → redirect về `/login`

3. **API Requests:**
   - Axios interceptor tự động thêm `Authorization: Bearer <token>` vào mọi request
   - Nếu API trả về 401 (unauthorized) → xóa token và redirect về `/login`

4. **Logout:**
   - Xóa token và user data khỏi `localStorage`
   - Redirect về `/login`

## 📄 Các trang quản lý

### Dashboard (`/dashboard`)
- Tổng quan doanh thu, đơn hàng, sản phẩm, khách hàng
- Đơn hàng gần đây
- Sản phẩm bán chạy

### Quản lý Nhân viên (`/nhanvien`)
- Danh sách nhân viên
- Tìm kiếm, lọc
- Thêm, sửa, xóa nhân viên

### Quản lý Sản phẩm (`/sanpham`)
- Grid view sản phẩm
- Tìm kiếm theo tên, mã
- Lọc theo danh mục
- Thêm, sửa, xóa sản phẩm

### Quản lý Banner (`/banner`)
- Danh sách banner
- Upload hình ảnh
- Sắp xếp thứ tự hiển thị

### Quản lý Ca làm việc (`/calamviec`)
- Danh sách ca làm việc
- Lịch phân công ca
- Thêm, sửa, xóa ca

### Quản lý Khuyến mãi (`/khuyenmai`)
- Danh sách chương trình khuyến mãi
- Trạng thái: Đang diễn ra, Sắp diễn ra, Đã kết thúc
- Thêm, sửa, xóa khuyến mãi

### Quản lý Đơn hàng (`/donhang`)
- Danh sách đơn hàng
- Trạng thái: Chờ xác nhận, Đang giao, Hoàn thành, Đã hủy
- Tìm kiếm, lọc theo trạng thái
- Xem chi tiết đơn hàng

## 🎨 UI/UX Features

- **Responsive Design:** Tự động điều chỉnh layout cho mobile, tablet, desktop
- **Collapsible Sidebar:** Thu gọn sidebar để tăng không gian hiển thị
- **Loading States:** Hiển thị trạng thái loading khi đăng nhập
- **Error Handling:** Thông báo lỗi rõ ràng khi đăng nhập thất bại
- **Protected Navigation:** Chỉ hiển thị menu khi đã đăng nhập

## 🔧 Configuration

### Vite Config (`vite.config.js`)
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    }
  }
}
```
Cấu hình proxy để forward request `/api/*` từ frontend (port 5173) sang backend (port 3000).

### Axios Config (`src/services/api.js`)
```javascript
// Request interceptor - tự động thêm token
config.headers.Authorization = `Bearer ${token}`;

// Response interceptor - tự động logout khi 401
if (error.response?.status === 401) {
  // Clear token and redirect to login
}
```

## 📝 Lưu ý

- **Backend phải chạy trước:** Backend server phải chạy ở port 3000 trước khi start frontend
- **Token expiration:** Token JWT có thời hạn, cần implement refresh token nếu cần session dài hạn
- **Mock data:** Các trang hiện đang dùng mock data, cần connect với API thật
- **CORS:** Backend đã cấu hình CORS cho phép frontend ở port 5173 truy cập

## 🚧 TODO - Các tính năng cần phát triển

- [ ] Connect tất cả pages với API thật (thay mock data)
- [ ] Implement CRUD forms (Modal hoặc separate page)
- [ ] Upload hình ảnh cho sản phẩm, banner
- [ ] Pagination cho danh sách dài
- [ ] Sorting, filtering nâng cao
- [ ] Export dữ liệu (Excel, PDF)
- [ ] Thông báo realtime (WebSocket)
- [ ] Dark mode
- [ ] Multi-language support

## 📞 Liên hệ

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trong repository.
