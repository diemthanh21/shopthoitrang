# Checkout Flow Implementation

## Overview
Implemented a complete checkout flow matching the MARC website design, allowing users to purchase products either directly ("MUA NGAY") or from their shopping cart.

## Architecture

### Mobile App (Flutter)

#### 1. Data Models (`lib/models/order_model.dart`)
- **Order**: Main order entity mapping to `donhang` table
  - Fields: id, customerId, orderDate, total, paymentMethod, paymentStatus, orderStatus, items
- **OrderItem**: Individual order line items mapping to `chitietdonhang` table
  - Fields: id, orderId, variantId, quantity, price
- **ShippingAddress**: Customer shipping address mapping to `diachikhachhang` table
  - Fields: id, customerId, address

#### 2. Services (`lib/services/order_service.dart`)
- **OrderService**: API integration for order management
  - `createOrder(Order)`: POST /api/donhang - Create new order with items
  - `getMyOrders()`: GET /api/donhang - Fetch user's orders (TODO: needs /me filter)
  - `getOrderById(int)`: GET /api/donhang/:id - Get order details
  - Uses JWT authentication via ApiClient

#### 3. UI Screens

##### CheckoutScreen (`lib/screens/checkout_screen.dart`)
Complete checkout UI with two entry modes:

**Entry Sources:**
- `CheckoutSource.buyNow`: Direct purchase from product detail (single item)
- `CheckoutSource.cart`: Purchase all items from shopping cart

**UI Sections:**
1. **Shipping Address** - TextField for delivery address input
2. **Payment Methods** - RadioListTile with 3 options:
   - Cash on Delivery (COD)
   - Bank Transfer (with bank account info)
   - ZaloPay QR Code (with QR display)
3. **Coupon Code** - TextField with "Áp dụng" button
4. **Order Summary** - Breakdown showing:
   - Subtotal (Tạm tính)
   - Shipping fee (Phí vận chuyển)
   - VAT (Thuế VAT)
   - Total (Tổng cộng)
5. **Bottom Bar** - Total price + "Đặt hàng" button

**Order Creation Flow:**
```dart
1. _loadOrderItems() - Build OrderItem list from variant (buyNow) or CartService (cart)
2. User fills shipping address
3. User selects payment method
4. User taps "Đặt hàng" button
5. _placeOrder():
   - Validates address is not empty
   - Gets customerId from AuthProvider
   - Creates Order object with items array
   - Calls OrderService.createOrder()
   - If from cart: calls CartService.clearCart()
   - Shows success/error snackbar
   - On success: pops to first route (home)
```

##### Product Detail Screen (`lib/screens/product_detail_screen.dart`)
- Added "MUA NGAY" button handler
- Validates variant selection before navigation
- Navigates to CheckoutScreen with:
  - source: CheckoutSource.buyNow
  - variant: _selectedVariant
  - quantity: _quantity
  - price: variant.price
  - product: _fullProduct or widget.product

##### Cart Screen (`lib/screens/cart_screen.dart`)
- Added "Thanh toán" button handler
- Navigates to CheckoutScreen with:
  - source: CheckoutSource.cart
  - No additional parameters (loads from CartService)

### Backend (Node.js + Supabase)

#### Updated Service (`src/services/donhang.service.js`)
Enhanced order creation to handle nested items array:

**Before:**
- Created only `donhang` record
- Ignored items array in request body

**After:**
```javascript
async create(body) {
  // 1. Create main order record in donhang table
  const order = await repo.create({
    makhachhang: body.makhachhang,
    thanhtien: body.thanhtien || 0,
    phuongthucthanhtoan: body.phuongthucthanhtoan,
    trangthaithanhtoan: body.trangthaithanhtoan || 'Chưa thanh toán',
    trangthaidonhang: body.trangthaidonhang || 'Đang xử lý',
  });

  // 2. Create order items in chitietdonhang table
  if (body.items && Array.isArray(body.items)) {
    for (const item of body.items) {
      await chitietdonhangService.taoMoi({
        madonhang: order.madonhang,
        machitietsanpham: item.variantId,
        soluong: item.quantity,
        dongia: item.price,
      });
    }
  }

  return order;
}
```

**Features:**
- Loops through items array from request body
- Creates chitietdonhang record for each item
- Links items to order via madonhang foreign key
- Includes error handling for individual items
- Logs creation progress for debugging

## Database Schema

### donhang (Orders)
```
madonhang (PK)         - Order ID
makhachhang (FK)       - Customer ID
ngaydathang            - Order date (auto)
thanhtien              - Total amount
phuongthucthanhtoan    - Payment method (COD/Bank/ZaloPay)
trangthaithanhtoan     - Payment status
trangthaidonhang       - Order status
```

### chitietdonhang (Order Items)
```
machitietdonhang (PK)    - Order item ID
madonhang (FK)           - Order ID reference
machitietsanpham (FK)    - Product variant ID
soluong                  - Quantity
dongia                   - Unit price
```

### diachikhachhang (Addresses)
```
madiachi (PK)          - Address ID
makhachhang (FK)       - Customer ID
diachi                 - Address text
```

## API Endpoints

### POST /api/donhang
Create new order with items

**Request Body:**
```json
{
  "makhachhang": 123,
  "thanhtien": 500000,
  "phuongthucthanhtoan": "COD",
  "trangthaithanhtoan": "Chưa thanh toán",
  "trangthaidonhang": "Đang xử lý",
  "items": [
    {
      "variantId": 456,
      "quantity": 2,
      "price": 250000
    }
  ]
}
```

**Response:**
```json
{
  "madonhang": 789,
  "makhachhang": 123,
  "ngaydathang": "2024-01-15T10:30:00Z",
  "thanhtien": 500000,
  "phuongthucthanhtoan": "COD",
  "trangthaithanhtoan": "Chưa thanh toán",
  "trangthaidonhang": "Đang xử lý"
}
```

## User Flow

### Scenario 1: Buy Now (Direct Purchase)
1. User views product detail page
2. Selects size/variant
3. Adjusts quantity
4. Taps "MUA NGAY" button
5. Navigated to CheckoutScreen (buyNow mode)
6. Fills shipping address
7. Selects payment method
8. Taps "Đặt hàng"
9. Order created with single item
10. Redirected to home screen

### Scenario 2: Cart Checkout (Multiple Items)
1. User adds multiple products to cart
2. Navigates to CartScreen
3. Reviews cart items
4. Taps "Thanh toán" button
5. Navigated to CheckoutScreen (cart mode)
6. Fills shipping address
7. Selects payment method
8. Taps "Đặt hàng"
9. Order created with all cart items
10. Cart automatically cleared
11. Redirected to home screen

## Payment Methods

### 1. Cash on Delivery (COD)
- Value: "COD"
- Description: "Thanh toán khi nhận hàng"
- Icon: money_outlined
- Default payment status: "Chưa thanh toán"

### 2. Bank Transfer
- Value: "Bank"
- Description: "Chuyển khoản ngân hàng\nTPBank - 0123456789 - NGUYEN VAN A"
- Icon: account_balance
- Default payment status: "Chưa thanh toán"

### 3. ZaloPay QR Code
- Value: "ZaloPay"
- Description: "Quét mã QR để thanh toán"
- Icon: qr_code
- Default payment status: "Chưa thanh toán"

## Order Statuses

### Payment Status (trangthaithanhtoan)
- "Chưa thanh toán" - Not paid
- "Đã thanh toán" - Paid
- "Hoàn tiền" - Refunded

### Order Status (trangthaidonhang)
- "Đang xử lý" - Processing (default)
- "Đã xác nhận" - Confirmed
- "Đang giao" - Shipping
- "Đã giao" - Delivered
- "Đã hủy" - Cancelled

## Testing Checklist

### Mobile App
- [ ] Navigate from product detail to checkout (buyNow)
- [ ] Navigate from cart to checkout (cart)
- [ ] Validate address requirement
- [ ] Test each payment method selection
- [ ] Verify order summary calculations
- [ ] Test order creation with single item
- [ ] Test order creation with multiple items
- [ ] Verify cart clears after cart checkout
- [ ] Check success/error messages
- [ ] Verify navigation after order placement

### Backend
- [ ] Restart server to apply changes
- [ ] Test POST /api/donhang with items array
- [ ] Verify donhang record created
- [ ] Verify chitietdonhang records created for each item
- [ ] Check madonhang foreign key linkage
- [ ] Test with empty items array
- [ ] Test with missing required fields
- [ ] Check console logs for debugging info

### Database
- [ ] Query donhang table for new orders
- [ ] Query chitietdonhang for order items
- [ ] Verify madonhang foreign key matches
- [ ] Check all fields populated correctly
- [ ] Verify timestamps (ngaydathang)

## Future Enhancements

### Address Management
- Save addresses to diachikhachhang table
- Allow selecting from saved addresses
- Edit/delete saved addresses
- Set default address

### Order Tracking
- Implement getMyOrders with /me filter
- Create order history screen
- Add order detail view
- Real-time order status updates

### Payment Integration
- ZaloPay API integration for QR generation
- Bank transfer verification webhook
- Payment confirmation flow
- Automatic payment status update

### Cart Optimization
- Add "Buy Now" to auto-clear cart option
- Save cart items when switching to buy now
- Merge buy now and cart if needed

### Validation
- Phone number validation for shipping
- Address format validation
- Coupon code validation API
- Stock availability check before order

### UX Improvements
- Order confirmation screen
- Email/SMS notifications
- Order cancellation feature
- Reorder from history

## Notes
- Backend uses service role key for Supabase (bypass RLS)
- Mobile app uses JWT token for authentication
- Cart uses donhang table with trangthaidonhang='cart' as temporary storage
- Order creation is synchronous (consider async for better UX)
- No transaction support yet (consider adding for atomicity)
