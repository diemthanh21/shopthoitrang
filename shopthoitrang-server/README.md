# Shop Thời Trang - Server API

Backend API cho hệ thống quản lý shop thời trang.

## 🚀 Cài đặt

```bash
# Clone repository
git clone <repository-url>

# Di chuyển vào thư mục
cd shopthoitrang-server

# Cài đặt dependencies
npm install

# Cài đặt bcrypt cho authentication
npm install bcrypt

# Copy .env.example sang .env và cấu hình
cp .env.example .env
```

## ⚙️ Cấu hình

Tạo file `.env` với nội dung:

```env
PORT=3000
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=1d
```

## 🏃 Chạy ứng dụng

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: http://localhost:3000

## �️ Migration bắt buộc cho tính năng địa chỉ giao hàng

Để hiển thị đúng địa chỉ khách đã chọn lúc thanh toán (mobile + web admin), cần cập nhật DB:

1) Thêm cột `madiachi` cho bảng `donhang`
- Chạy file: `ADD_MADIACHI_TO_DONHANG.sql`

2) Bảng snapshot địa chỉ theo đơn (khuyến nghị)
- Chạy file: `CREATE_DIA_CHI_GIAO_HANG.sql`

Cả hai file đều an toàn chạy nhiều lần. Sau khi chạy, khởi động lại server.

## �📚 API Documentation

Swagger UI: http://localhost:3000/api-docs

## 🔐 Authentication

Hệ thống sử dụng JWT cho authentication. Chi tiết xem file [AUTH_SUMMARY.md](./AUTH_SUMMARY.md)

### Endpoints chính:

**Public:**
- `POST /api/auth/register/customer` - Đăng ký khách hàng
- `POST /api/auth/login/customer` - Đăng nhập khách hàng
- `POST /api/auth/login/employee` - Đăng nhập nhân viên

**Protected:**
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/auth/change-password/customer` - Đổi mật khẩu

### Sử dụng Token

```bash
# Lấy token từ response khi login
Authorization: Bearer <your-jwt-token>
```

## 📁 Cấu trúc thư mục

```
src/
├── controllers/      # Xử lý request/response
├── services/         # Business logic
├── repositories/     # Truy vấn database
├── models/          # Data models
├── routes/          # API routes
├── middlewares/     # Express middlewares
│   ├── auth.middleware.js     # Xác thực JWT
│   └── role.middleware.js     # Kiểm tra quyền
└── utils/           # Utility functions
```

## 🗂️ Modules chính

### Authentication
- Login/Register cho khách hàng và nhân viên
- JWT token-based authentication
- Role-based authorization (customer/employee)

### Quản lý sản phẩm
- CRUD sản phẩm
- Danh mục, thương hiệu
- Hình ảnh, chi tiết sản phẩm

### Quản lý đơn hàng
- Tạo và theo dõi đơn hàng
- Chi tiết đơn hàng
- Trạng thái đơn hàng

### Quản lý nhân viên
- Tài khoản nhân viên
- Ca làm việc
- Phân công ca

### Khuyến mãi & Marketing
- Banner
- Khuyến mãi
- Mã giảm giá

## 🔧 Testing

```bash
# Test authentication system
node test-auth.js
```

## 📖 Tài liệu bổ sung

- [AUTH_SETUP.md](./AUTH_SETUP.md) - Hướng dẫn cài đặt authentication
- [AUTH_SUMMARY.md](./AUTH_SUMMARY.md) - Tổng quan về authentication & authorization

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js v5
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hash:** bcrypt
- **API Documentation:** Swagger (swagger-jsdoc, swagger-ui-express)
- **Environment:** dotenv

## 📝 TODO

- [ ] Cài đặt bcrypt
- [ ] Migration mật khẩu cũ (plain text → hashed)
- [ ] Tách public/protected routes cho tất cả modules
- [ ] Thêm rate limiting
- [ ] Thêm refresh token
- [ ] Thêm email verification
- [ ] Thêm forgot password

## 🤝 Contributing

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

ISC

## 👥 Authors

- diemthanh21

phát triển thêm
Hiện tại login đc rùi  nhung con 1 vấn đề là phân quyền 
bé và mấy bạn thống nhất với nhau 
staff dùng những quyền nào gôm admin tất cả còn nhân viên sao đó dựa vào role
và user sử dụng quyền gì trong hệ thông
mua hàng thanh toán xem lịch sử

nhưng vậy sẽ biết được chức năng gì cần user đăng nhập và chức năng gì để có staff đăng nhập vậy sẽ có 2 người test để bt servẻ cần sửa gì 
hiện tại có thể test trên api doc đẻ dễ thao tác còn muốn log đầy đủ thì postman
đó nếu phân quyên sẽ sửa và bổ sủng ở router con lại kh đùng gì nữ thêm ở middlewares