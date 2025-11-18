# Order Status Migration - November 7, 2025

## Vấn đề
Database có các đơn hàng cũ với tên trạng thái cũ:
- "Đang xử lý" (outdated)
- "Hoàn thành" (outdated)
- Các biến thể của "Hủy"

Mobile app đang dùng tên trạng thái mới theo Shopee:
- "Chờ xác nhận"
- "Chờ lấy hàng"
- "Đang giao"
- "Đã giao"
- "Đã hủy"

## Giải pháp đã thực hiện

### 1. Database Migration
Chạy script: `scripts/migrate-order-status.js`

Kết quả:
- ✅ 7 đơn: "Đang xử lý" → "Chờ xác nhận"
- ✅ 4 đơn: "Hoàn thành" → "Đã giao"
- ✅ 0 đơn: Các biến thể "Hủy" → "Đã hủy"

### 2. Backend Default Status
File: `src/services/donhang.service.js`
- Changed: `trangthaidonhang: body.trangthaidonhang || 'Đang xử lý'`
- To: `trangthaidonhang: body.trangthaidonhang || 'Chờ xác nhận'`

### 3. Mobile App Clean-up
- Removed status normalization logic (no longer needed)
- Database is now clean with consistent status names

## Trạng thái hiện tại
```
Chờ xác nhận: 11 đơn
Chờ lấy hàng: 2 đơn
Đang giao: 1 đơn
Đã giao: 4 đơn
Đã hủy: 0 đơn
```

## Luồng hủy đơn hàng

### Có thể hủy:
- ✅ "Chờ xác nhận"
- ✅ "Chờ lấy hàng"

### Không thể hủy:
- ❌ "Đang giao"
- ❌ "Đã giao"
- ❌ "Đã hủy"

### Khi hủy đơn:
1. Call API: `PUT /api/donhang/:id` với `{trangthaidonhang: "Đã hủy"}`
2. Server cập nhật Supabase
3. Mobile reload danh sách đơn hàng
4. Tự động chuyển sang tab "Đã hủy"
5. Đơn biến mất khỏi tab cũ, xuất hiện ở tab "Đã hủy"

## Chạy migration lại (nếu cần)
```bash
cd shopthoitrang-server
node scripts/migrate-order-status.js
```

## Ghi chú
- Đơn hàng mới tạo sẽ tự động có trạng thái đúng
- Không còn cần mapping logic trong mobile app
- Database đã được chuẩn hóa hoàn toàn
