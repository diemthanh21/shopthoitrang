# Tính năng Tìm kiếm Tất cả Khách hàng

## Mô tả
Cho phép nhân viên tìm kiếm và nhắn tin với BẤT KỲ khách hàng nào trong hệ thống, bao gồm cả những khách hàng chưa có lịch sử chat. Khi nhân viên chọn một khách hàng chưa có chatbox, hệ thống sẽ tự động tạo chatbox mới.

## Thay đổi Backend

### 1. chat.controller.js
Đã thêm 2 hàm mới:

#### a) `listAllCustomersWithChats()`
- **Endpoint**: `GET /api/chat/admin/all-customers`
- **Mục đích**: Trả về danh sách TẤT CẢ khách hàng kèm thông tin chatbox (nếu có)
- **Cấu trúc dữ liệu trả về**:
```javascript
[
  {
    makhachhang: 1,
    hoten: "Nguyễn Văn A",
    email: "a@example.com",
    sodienthoai: "0123456789",
    chatbox: {
      machatbox: 5,
      makhachhang: 1,
      manhanvien: 2,
      ngaytao: "2024-01-15",
      trangthai: "Đang hoạt động",
      nhanVien: { manhanvien: 2, tendangnhap: "nhanvien1" },
      lastMessage: { ... },
      unreadFromCustomer: 3
    } // hoặc null nếu chưa có chatbox
  },
  // ...
]
```

#### b) `startChatForCustomer()`
- **Endpoint**: `POST /api/chat/admin/start-for-customer`
- **Mục đích**: Cho phép nhân viên tạo hoặc lấy chatbox cho một khách hàng cụ thể
- **Body**: `{ makhachhang: 123 }`
- **Trả về**: Chatbox mới tạo hoặc chatbox đã tồn tại

### 2. chat.route.js
Đã thêm 2 routes mới:
- `GET /api/chat/admin/all-customers` - Lấy tất cả khách hàng
- `POST /api/chat/admin/start-for-customer` - Tạo chatbox cho khách hàng

## Thay đổi Frontend

### 1. chatService.js
Đã thêm 2 phương thức:
```javascript
async listAllCustomersWithChats() {
  const res = await api.get('/chat/admin/all-customers');
  return res.data;
}

async startChatForCustomer(makhachhang) {
  const res = await api.post('/chat/admin/start-for-customer', { makhachhang });
  return res.data;
}
```

### 2. TinNhanPage.jsx
Các thay đổi chính:

#### a) Hàm `load()`
- Thay đổi từ `chatService.listChatBoxes()` sang `chatService.listAllCustomersWithChats()`
- Xử lý cấu trúc dữ liệu mới (customer với optional chatbox)

#### b) Hàm `openChat()`
- Kiểm tra nếu khách hàng chưa có chatbox
- Tự động gọi `startChatForCustomer()` để tạo chatbox mới
- Sau đó mở drawer để nhắn tin

#### c) Hàm `filteredList`
- Cập nhật logic lọc và sắp xếp:
  1. Khách hàng có tin chưa đọc (ưu tiên cao nhất)
  2. Khách hàng có chatbox nhưng đã đọc
  3. Khách hàng chưa có chatbox (chỉ hiện ở filter "Tất cả")
- Tìm kiếm theo tên khách hàng (không bắt buộc phải có chatbox)

#### d) Table Rendering
- Hiển thị "Chưa có hội thoại" thay vì "Chatbox #XXX" nếu chưa có chatbox
- Hiển thị "Bắt đầu trò chuyện" thay vì tin nhắn cuối nếu chưa có chatbox
- Nút "Bắt đầu" thay vì "Mở" cho khách hàng chưa có chatbox

#### e) ChatDrawer Component
- Xử lý cả hai cấu trúc dữ liệu:
  - Customer item với `chatbox` property
  - Chatbox trực tiếp (backward compatibility)
- Header hiển thị "Hội thoại mới" nếu chưa có chatbox

## Luồng hoạt động

### Trường hợp 1: Khách hàng đã có chatbox
1. Nhân viên mở trang tin nhắn
2. Hệ thống tải tất cả khách hàng với thông tin chatbox
3. Nhân viên tìm kiếm hoặc chọn khách hàng
4. Click "Mở" → Mở drawer và hiển thị lịch sử chat

### Trường hợp 2: Khách hàng chưa có chatbox
1. Nhân viên mở trang tin nhắn
2. Hệ thống tải tất cả khách hàng (bao gồm cả những người chưa chat)
3. Nhân viên tìm kiếm khách hàng (ví dụ: "Nguyễn Văn B")
4. Thấy khách hàng với label "Chưa có hội thoại"
5. Click "Bắt đầu"
6. Hệ thống tự động tạo chatbox mới
7. Drawer mở với header "Hội thoại mới"
8. Nhân viên gửi tin nhắn đầu tiên
9. Chatbox được tạo và cập nhật trong danh sách

## Sắp xếp ưu tiên

Danh sách khách hàng được sắp xếp theo thứ tự:
1. **Tin chưa đọc từ khách hàng** (màu vàng highlight)
2. **Có chatbox, đã đọc hết** (sắp xếp theo thời gian tin nhắn mới nhất)
3. **Chưa có chatbox** (sắp xếp theo mã khách hàng, mới nhất trước)

## Filter Status

- **Tất cả**: Hiển thị tất cả khách hàng (có hoặc chưa có chatbox)
- **Chưa đọc**: Chỉ khách hàng có tin chưa đọc
- **Đã đọc**: Chỉ khách hàng có chatbox và đã đọc hết tin

**Lưu ý**: Khách hàng chưa có chatbox chỉ xuất hiện trong filter "Tất cả"

## Lợi ích

1. **Chủ động tương tác**: Nhân viên có thể chủ động liên hệ khách hàng thay vì chờ khách hàng nhắn tin trước
2. **Tìm kiếm toàn diện**: Tìm kiếm theo tên trong toàn bộ database khách hàng
3. **UX mượt mà**: Tự động tạo chatbox khi cần, không yêu cầu thao tác thủ công
4. **Phân loại rõ ràng**: Dễ dàng phân biệt khách hàng đã/chưa có lịch sử chat

## Testing

Để test tính năng:
1. Đăng nhập với tài khoản nhân viên
2. Vào trang Tin nhắn
3. Tìm kiếm một khách hàng chưa từng chat
4. Click "Bắt đầu"
5. Gửi tin nhắn đầu tiên
6. Kiểm tra chatbox mới được tạo trong database
7. Refresh trang và xác nhận chatbox vẫn hiển thị

## Files đã thay đổi

### Backend
- `shopthoitrang-server/src/controllers/chat.controller.js`
- `shopthoitrang-server/src/routes/chat.route.js`

### Frontend
- `shopthoitrang-web/src/services/chatService.js`
- `shopthoitrang-web/src/pages/TinNhanPage.jsx`

## Compatibility

Tất cả API và component cũ vẫn hoạt động bình thường (backward compatible):
- `listChatBoxes()` vẫn tồn tại
- `startChat()` cho khách hàng vẫn hoạt động
- Các component khác sử dụng chat vẫn hoạt động

## Ngày thực hiện
2024 (Date of implementation)
