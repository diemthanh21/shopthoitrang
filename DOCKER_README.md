# Shop Thời Trang - Docker Deployment

## 🚀 Cách chạy bằng Docker

### Bước 1: Đảm bảo có Docker Desktop
```bash
docker --version
docker-compose --version
```

### Bước 2: Build và chạy toàn bộ app
```bash
# Trong thư mục gốc (chứa docker-compose.yml)
docker-compose up --build
```

### Bước 3: Truy cập ứng dụng
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api-docs

## 🔄 Các lệnh Docker hữu ích

```bash
# Chạy trong background
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Dừng containers
docker-compose down

# Xóa containers và images
docker-compose down --rmi all

# Rebuild chỉ frontend
docker-compose build shopthoitrang-web

# Rebuild chỉ backend  
docker-compose build shopthoitrang-server
```

## 🌐 Chia sẻ với máy khác

### Cách 1: Trong mạng LAN
```bash
# Tìm IP máy host
ipconfig  # Windows
ifconfig  # Mac/Linux

# Ví dụ IP là 192.168.1.100
# Máy khác truy cập: http://192.168.1.100
```

### Cách 2: Tạo Docker image để share
```bash
# Tạo images
docker save -o shopthoitrang.tar shopthoitrang_shopthoitrang-web shopthoitrang_shopthoitrang-server

# Copy file .tar cho máy khác, rồi:
docker load -i shopthoitrang.tar
docker-compose up
```

## ⚙️ Environment Variables

Đảm bảo file `.env` trong `shopthoitrang-server` có:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
```

## 🏗️ Kiến trúc Docker

- **Frontend**: React + Vite → Nginx (Port 80)
- **Backend**: Node.js + Express (Port 3000)  
- **Proxy**: Nginx forward `/api/*` requests to backend
- **Network**: Internal Docker network for service communication