# Hướng dẫn cấu hình gửi ảnh trong Chat

## Đã hoàn thành

### 1. Database Migration
- ✅ Đã thêm cột `anhchat VARCHAR(500)` vào bảng `noidungchat`
- File migration: `ADD_ANHCHAT_COLUMN.sql`

### 2. Server-side Changes
- ✅ Cập nhật model `NoiDungChat` để hỗ trợ trường `anhchat`
- ✅ Cập nhật controller `chat.controller.js` để nhận và lưu `anhchat`
- ✅ Thêm xử lý cho tin nhắn có ảnh (text là optional khi có ảnh)

### 3. Web Client Changes
- ✅ Thêm nút chọn ảnh (📷) trong giao diện chat
- ✅ Hiển thị preview ảnh trước khi gửi
- ✅ Hiển thị ảnh trong tin nhắn đã gửi
- ✅ Cập nhật `chatService` để gửi `anhchat`

## Cần cấu hình thêm

### Cloudinary Setup (hoặc dịch vụ lưu trữ ảnh khác)

#### Option 1: Sử dụng Cloudinary (Khuyên dùng)

1. **Đăng ký tài khoản Cloudinary miễn phí:**
   - Truy cập: https://cloudinary.com/users/register/free
   - Hoàn thành đăng ký và xác nhận email

2. **Lấy thông tin cấu hình:**
   - Vào Dashboard: https://cloudinary.com/console
   - Lấy `Cloud Name`, `API Key`, `API Secret`

3. **Tạo Upload Preset:**
   - Vào Settings > Upload
   - Scroll xuống "Upload presets"
   - Click "Add upload preset"
   - Đặt tên: `chat_images`
   - Signing Mode: chọn "Unsigned"
   - Folder: `elora/chat` (tùy chọn)
   - Save

4. **Cập nhật code trong TinNhanPage.jsx:**
   ```javascript
   // Dòng ~106-115, thay YOUR_CLOUD_NAME bằng cloud name của bạn
   const uploadRes = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload', {
     method: 'POST',
     body: formData
   });
   ```

#### Option 2: Sử dụng Backend để upload

Nếu muốn upload qua server thay vì trực tiếp từ client:

1. **Cài đặt dependencies trên server:**
   ```bash
   npm install cloudinary multer multer-storage-cloudinary
   ```

2. **Tạo file upload route trên server:**
   - Tạo endpoint `/api/upload/chat-image`
   - Xử lý upload và trả về URL

3. **Cập nhật client code:**
   ```javascript
   // Thay đổi phần upload trong handleSend
   const formData = new FormData();
   formData.append('image', selectedImage);
   
   const uploadRes = await api.post('/upload/chat-image', formData, {
     headers: { 'Content-Type': 'multipart/form-data' }
   });
   imageUrl = uploadRes.data.url;
   ```

## Tính năng đã hỗ trợ

- ✅ Gửi tin nhắn chỉ có text
- ✅ Gửi tin nhắn chỉ có ảnh
- ✅ Gửi tin nhắn có cả text và ảnh
- ✅ Preview ảnh trước khi gửi
- ✅ Hiển thị ảnh trong lịch sử chat
- ✅ Giới hạn kích thước ảnh (5MB)
- ✅ Tự động đánh dấu đã đọc khi trả lời

## Test

1. Mở trang Thông báo trong admin panel
2. Click "Mở" một cuộc chat
3. Click nút 📷 để chọn ảnh
4. Xem preview ảnh và có thể xóa bằng nút ×
5. Nhập text (tùy chọn) và click "Gửi"
6. Ảnh sẽ hiển thị trong tin nhắn

## Lưu ý

- Hiện tại code đã sẵn sàng nhưng cần cấu hình Cloudinary để thực sự upload được ảnh
- Giới hạn 5MB cho mỗi ảnh (có thể điều chỉnh trong code)
- Hỗ trợ tất cả định dạng ảnh (jpg, png, gif, webp, etc.)
