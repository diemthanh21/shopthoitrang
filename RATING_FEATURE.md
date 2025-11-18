# Tính năng Đánh giá & Sản phẩm đề xuất

## Tổng quan

Đã thêm 2 tính năng mới vào màn hình chi tiết sản phẩm (`product_detail_screen.dart`):

### 1. Đánh giá sản phẩm (Rating/Review)

**Hiển thị:**
- Danh sách đánh giá từ khách hàng khác (1-5 sao + bình luận)
- Điểm trung bình và tổng số đánh giá
- Hiển thị 3 đánh giá đầu tiên, có nút "Xem tất cả" nếu có nhiều hơn

**Chức năng đánh giá:**
- Chỉ hiển thị nút "Viết đánh giá" khi:
  - Người dùng đã đăng nhập
  - Có ít nhất 1 đơn hàng **Hoàn thành** (status chứa "hoan", "hoàn", "complete")
  - Đơn hàng đó chứa một trong các variant của sản phẩm hiện tại
- Dialog đánh giá cho phép chọn 1-5 sao và viết bình luận (tùy chọn)

**Backend:**
- Endpoint: `GET /api/danhgia?masanpham={id}` - lấy danh sách đánh giá (không cần auth)
- Endpoint: `POST /api/danhgia` - tạo đánh giá mới (cần auth)
- Đã cập nhật route để GET public, POST/PUT/DELETE cần token

### 2. Có thể bạn sẽ thích

**Hiển thị:**
- 6 sản phẩm được sắp xếp theo rating cao nhất
- Hiển thị ảnh, tên, giá
- Click vào để xem chi tiết sản phẩm

**Logic:**
- Load từ endpoint catalog với `orderBy=rating` và `sortDesc=true`
- Fallback nếu backend chưa hỗ trợ orderBy

## Files đã tạo/sửa

### Mobile (Flutter)

**Tạo mới:**
- `lib/models/rating_model.dart` - Model cho bảng `danhgia`
- `lib/services/rating_service.dart` - Service gọi API đánh giá

**Cập nhật:**
- `lib/screens/product_detail_screen.dart`:
  - Thêm state variables cho ratings và recommendations
  - Thêm `_loadRatings()`, `_checkCanRate()`, `_showRatingDialog()`, `_loadYouMayLike()`
  - Thêm UI sections cho ratings và "Có thể bạn sẽ thích"
  - Thêm helper widgets: `_buildRatingCard()`, `_buildProductCard()`

### Server (Node.js)

**Cập nhật:**
- `src/routes/danhgia.route.js`:
  - Chuyển GET endpoints lên trước `authenticateToken` middleware
  - GET không cần auth, POST/PUT/DELETE vẫn cần auth

## Schema Database

Bảng `danhgia` cần có các cột:
```sql
CREATE TABLE danhgia (
  madanhgia SERIAL PRIMARY KEY,
  masanpham INT NOT NULL REFERENCES sanpham(masanpham),
  machitietsanpham INT REFERENCES chitietsanpham(machitietsanpham),
  makhachhang INT NOT NULL REFERENCES taikhoankhachhang(makhachhang),
  diemdanhgia INT NOT NULL CHECK (diemdanhgia >= 1 AND diemdanhgia <= 5),
  binhluan TEXT,
  ngaydanhgia TIMESTAMP DEFAULT NOW(),
  hinhanh TEXT,
  phanhoitushop TEXT
);
```

## Trạng thái đơn hàng

Đơn hàng được coi là "Hoàn thành" khi `trangthaidonhang` chứa:
- "hoan"
- "hoàn"
- "complete"
- "đã ho" (từ "đã hoàn thành")

## Test

### Test đánh giá:
1. Login với tài khoản đã mua hàng (đơn hoàn thành)
2. Vào chi tiết sản phẩm đã mua
3. Thấy nút "Viết đánh giá"
4. Click và submit rating
5. Refresh để thấy đánh giá mới

### Test sản phẩm đề xuất:
1. Vào bất kỳ chi tiết sản phẩm nào
2. Scroll xuống phần "Có thể bạn sẽ thích"
3. Thấy 6 sản phẩm bán chạy (rating cao)
4. Click vào để xem chi tiết

## Screenshots

### Phần đánh giá
```
┌─────────────────────────────────────┐
│ Đánh giá sản phẩm  ⭐ 4.5 (12)     │
│                                     │
│ [Viết đánh giá]  (nếu đủ điều kiện)│
│                                     │
│ ⭐⭐⭐⭐⭐  Hôm nay                  │
│ Sản phẩm rất đẹp...                │
│                                     │
│ ⭐⭐⭐⭐☆  15/11/2025               │
│ Chất lượng ok...                    │
│                                     │
│ [Xem tất cả đánh giá]              │
└─────────────────────────────────────┘
```

### Có thể bạn sẽ thích
```
┌─────────────────────────────────────┐
│ Có thể bạn sẽ thích                 │
│                                     │
│ [Ảnh] [Ảnh] [Ảnh] [Ảnh] [Ảnh] ... │
│ Tên    Tên    Tên    Tên    Tên     │
│ 450k   350k   520k   280k   395k    │
└─────────────────────────────────────┘
```

## Ghi chú

- Ratings được load public (không cần đăng nhập) để tất cả người dùng đều thấy
- Chỉ cần đăng nhập khi muốn viết đánh giá
- "Có thể bạn sẽ thích" sử dụng logic rating cao nhất, có thể thay đổi thành "bán chạy nhất" hoặc "mới nhất" bằng cách đổi `orderBy` parameter
