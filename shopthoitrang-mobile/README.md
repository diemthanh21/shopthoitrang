# shopthoitrang_mobile

Ứng dụng Flutter dành cho khách hàng Shop Thời Trang.

## Luồng Trả hàng và Đổi hàng

Ứng dụng hỗ trợ đầy đủ quy trình Trả hàng và Đổi hàng với giao diện thân thiện:

- Tạo yêu cầu từ màn hình Chi tiết đơn hàng:
	- Trả hàng: chọn sản phẩm, số lượng, lý do (có mục "Khác" + mô tả), tùy chọn ảnh minh họa lỗi.
	- Đổi hàng: chọn sản phẩm cũ, nhập mã biến thể mới (variant id), số lượng, lý do (có "Khác"), tùy chọn ảnh.
- Kiểm tra điều kiện thời gian: chỉ cho phép trong vòng 7 ngày kể từ ngày giao hàng.
- Màn hình danh sách: hiển thị trạng thái bằng badge màu sắc, dễ theo dõi.
- Màn hình chi tiết:
	- Trả hàng: hiện hướng dẫn gửi hàng, kết quả kiểm tra, và khối Hoàn tiền (tính toán, thực hiện hoàn tiền khi đủ điều kiện).
	- Đổi hàng: hiển thị chênh lệch giá, trạng thái thanh toán, voucher (nếu có) và timeline xử lý.

## Kiểm thử

Đã bổ sung một số widget test cơ bản để kiểm tra logic bật/tắt nút gửi theo điều kiện nhập liệu và khung thời gian 7 ngày.

- `test/new_return_screen_test.dart`: 
	- Ban đầu nút gửi bị vô hiệu.
	- Sau khi chọn sản phẩm và lý do hợp lệ → nút được bật.
	- Chọn "Khác" nhưng chưa nhập mô tả → vẫn bị vô hiệu; nhập mô tả → được bật.
	- Khi quá hạn 7 ngày → nút luôn vô hiệu và có cảnh báo.

- `test/new_exchange_screen_test.dart`:
	- Yêu cầu chọn hàng cũ, nhập variant id mới và chọn lý do → nút mới được bật.
	- Với lý do "Khác" cần mô tả bổ sung.

### Chạy test (tuỳ chọn)

Yêu cầu cài đặt Flutter SDK. Từ thư mục `shopthoitrang-mobile/`:

```
flutter test
```

## Ghi chú triển khai

- Sử dụng Provider để quản lý trạng thái danh sách/chi tiết trả hàng và đổi hàng.
- Sử dụng `image_picker` để chọn ảnh minh họa; ảnh được encode base64 trước khi gửi API.
- Ánh xạ trạng thái kỹ thuật sang nhãn tiếng Việt thân thiện ở phần UI (badge, timeline).

