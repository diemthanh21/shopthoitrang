# Debug Cart Issues - Giỏ hàng không hiển thị sản phẩm

## Vấn đề
- Thêm sản phẩm vào giỏ hàng thành công (có thông báo "Đã thêm vào giỏ hàng")
- Nhưng khi vào CartScreen, hiển thị "Giỏ hàng trống"

## Nguyên nhân có thể
1. **Token không đúng**: Backend không nhận diện được userId từ JWT token
2. **Cart chưa được tạo**: Backend trả về empty cart
3. **Items không được parse**: Response có data nhưng mobile không parse đúng
4. **Timing issue**: Data chưa được reload khi navigate

## Đã sửa

### 1. Auto-reload Cart khi focus (cart_screen.dart)
```dart
@override
void didChangeDependencies() {
  super.didChangeDependencies();
  // Reload cart when screen becomes active
  if (mounted) {
    _loadCart();
  }
}
```

**Lý do**: Khi navigate từ ProductDetail → CartScreen, cart chưa được reload. Bây giờ sẽ tự động reload mỗi khi screen active.

### 2. Debug logging trong CartScreen
```dart
Future<void> _loadCart() async {
  setState(() => _isLoading = true);
  try {
    print('[CartScreen] Loading cart...');
    final cart = await _cartService.getCart();
    print('[CartScreen] Cart loaded: ${cart.items.length} items, total: ${cart.total}');
    // ...
  }
}
```

**Mục đích**: Xem được cart có bao nhiêu items sau khi load.

### 3. Debug logging trong Cart.fromJson (cart_model.dart)
```dart
factory Cart.fromJson(Map<String, dynamic> json) {
  print('[Cart.fromJson] Raw JSON: $json');
  final items = (json['items'] as List<dynamic>?)
          ?.map((item) => CartItem.fromJson(item))
          .toList() ??
      [];
  print('[Cart.fromJson] Parsed ${items.length} items');
  // ...
}
```

**Mục đích**: Kiểm tra raw response từ backend và số lượng items sau khi parse.

## Cách test

### Bước 1: Hot Restart
```bash
# Trong Flutter app, nhấn 'R' trong terminal hoặc hot restart button
```

### Bước 2: Thêm sản phẩm vào giỏ
1. Vào trang chi tiết sản phẩm
2. Chọn size/màu
3. Nhấn "THÊM VÀO GIỎ"
4. Xem console output:

```
[CartService.getCart] http://10.0.2.2:3000/api/cart -> items=1 total=595000
```

### Bước 3: Xem giỏ hàng
1. Nhấn icon giỏ hàng hoặc navigate tự động
2. Kiểm tra console logs:

```
[CartScreen] Loading cart...
[Cart.fromJson] Raw JSON: {cartId: 123, items: [{...}], total: 595000, itemCount: 1}
[Cart.fromJson] Parsed 1 items
[CartScreen] Cart loaded: 1 items, total: 595000.0
```

### Bước 4: Kiểm tra backend logs
```
[GET /cart] userId = 1
[GET /cart] cartId = 123 items = 1
```

## Troubleshooting

### Nếu log hiển thị "items=0"

**Backend issue**: 
- Check userId trong token có đúng không
- Check table `donhang` có record với `trangthaidonhang='cart'` không
- Check table `chitietdonhang` có items với `madonhang` tương ứng không

**Query Supabase trực tiếp**:
```sql
-- Tìm cart của user
SELECT * FROM donhang 
WHERE makhachhang = 1 
AND trangthaidonhang = 'cart';

-- Tìm items trong cart
SELECT * FROM chitietdonhang 
WHERE madonhang = [cartId từ query trên];
```

### Nếu log hiển thị "Parsed 0 items" nhưng backend trả về items

**Parsing issue**:
- Check cấu trúc JSON response từ backend
- Check Cart model mapping có đúng keys không
- Log raw JSON để xem structure

### Nếu CartScreen không reload

**Navigation issue**:
- Đảm bảo dùng `Navigator.push()` không phải `Navigator.replace()`
- Check `didChangeDependencies()` có được gọi không

### Nếu backend trả về 401/403

**Auth issue**:
- Token không được gửi đúng
- Token expired
- UserId không có trong token payload

**Fix**: 
```dart
// Check token trong CartService
final token = await _getToken();
print('[CartService] Token: ${token?.substring(0, 20)}...');
```

## Expected Flow

```
User taps "THÊM VÀO GIỎ"
    ↓
CartService.addToCart() 
    → POST /api/cart/add with JWT token
    ↓
Backend: 
    1. Extract userId from token
    2. Find or create cart (donhang with trangthaidonhang='cart')
    3. Add/update item in chitietdonhang
    ↓
Response: {message: "Đã thêm vào giỏ hàng", item: {...}}
    ↓
Navigate to CartScreen
    ↓
didChangeDependencies() → _loadCart()
    ↓
CartService.getCart()
    → GET /api/cart with JWT token
    ↓
Backend:
    1. Extract userId from token
    2. Find cart (donhang)
    3. Get items from chitietdonhang with JOIN chitietsanpham, sanpham, hinhanhsanpham
    4. Format response
    ↓
Response: {cartId, items: [{id, variantId, quantity, price, variant: {...}}], total, itemCount}
    ↓
Cart.fromJson(response) → Parse items
    ↓
setState() → Update UI with cart items
    ↓
Display cart with product images, names, prices
```

## Checklist Debug

- [ ] Backend logs show correct userId
- [ ] Backend logs show cartId created/found
- [ ] Backend logs show items count > 0
- [ ] Mobile logs show CartService.getCart called
- [ ] Mobile logs show raw JSON response
- [ ] Mobile logs show parsed items count > 0
- [ ] CartScreen logs show cart loaded with items
- [ ] UI displays product cards (not empty cart message)

## Console Commands

### Check backend server running
```bash
cd shopthoitrang-server
npm start
# Should see: Server running on port 3000
```

### Check mobile connected to backend
```dart
// In app_config.dart
static const String apiBaseUrl = 'http://10.0.2.2:3000/api';  // Android emulator
// OR
static const String apiBaseUrl = 'http://localhost:3000/api';  // iOS simulator
```

### Test API directly
```bash
# Get token first (login)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Use token to get cart
curl -X GET http://localhost:3000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps if Still Not Working

1. **Capture full logs**:
   - Backend console output (full request/response)
   - Mobile console output (all prints)
   - Network inspector in VS Code/Android Studio

2. **Test API independently**:
   - Use Postman/curl to test /api/cart/add
   - Use Postman/curl to test /api/cart GET
   - Verify response structure matches Cart model

3. **Check database state**:
   - Login to Supabase dashboard
   - Check `donhang` table for user's cart
   - Check `chitietdonhang` for items
   - Verify foreign keys are correct

4. **Simplify test case**:
   - Add hardcoded sample data in backend
   - Bypass auth temporarily
   - Return mock cart with 1 item
   - Verify mobile can parse and display

## Contact Points

If issue persists after all debugging:
- Check JWT payload structure (what fields does token contain?)
- Check Supabase RLS policies (might block queries)
- Check CORS settings (might block mobile requests)
- Check network connectivity (emulator can reach localhost:3000?)
