import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/order_model.dart';
import '../models/product_model.dart';
import '../services/order_service.dart';
import '../services/cart_service.dart';
import '../providers/auth_provider.dart';

enum CheckoutSource { buyNow, cart }

class CheckoutScreen extends StatefulWidget {
  final CheckoutSource source;
  final ProductVariant? variant; // Nếu mua ngay
  final int? quantity; // Nếu mua ngay
  final double? price; // Nếu mua ngay
  final Product? product; // Để hiển thị tên sản phẩm
  final List<int>? selectedItemIds; // IDs của items được chọn từ cart

  const CheckoutScreen({
    super.key,
    required this.source,
    this.variant,
    this.quantity,
    this.price,
    this.product,
    this.selectedItemIds,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final OrderService _orderService = OrderService();
  final CartService _cartService = CartService();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();
  final TextEditingController _couponController = TextEditingController();

  String _selectedPaymentMethod = 'COD'; // COD, Bank, ZaloPay
  bool _isLoading = false;
  List<OrderItem> _orderItems = [];
  double _totalAmount = 0;

  @override
  void initState() {
    super.initState();
    _loadOrderItems();
  }

  Future<void> _loadOrderItems() async {
    setState(() => _isLoading = true);

    try {
      if (widget.source == CheckoutSource.buyNow) {
        // Mua ngay: 1 sản phẩm
        _orderItems = [
          OrderItem(
            variantId: widget.variant!.id,
            quantity: widget.quantity ?? 1,
            price: widget.price ?? widget.variant!.price,
          ),
        ];
        _totalAmount = _orderItems.first.total;
      } else {
        // Từ giỏ hàng - chỉ lấy items đã chọn
        final cart = await _cartService.getCart();
        final selectedIds = widget.selectedItemIds ?? [];

        _orderItems = cart.items
            .where(
                (item) => selectedIds.isEmpty || selectedIds.contains(item.id))
            .map((item) => OrderItem(
                  id: item.id, // Lưu cart item ID để xóa sau khi thanh toán
                  variantId: item.variantId,
                  quantity: item.quantity,
                  price: item.price,
                ))
            .toList();
        _totalAmount =
            _orderItems.fold<double>(0, (sum, item) => sum + item.total);
      }
    } catch (e) {
      debugPrint('Error loading order items: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _placeOrder() async {
    if (_addressController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập địa chỉ giao hàng'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final auth = context.read<AuthProvider>();
      if (!auth.isAuthenticated || auth.user == null) {
        throw Exception('Chưa đăng nhập');
      }

      final order = Order(
        customerId: auth.user!.maKhachHang,
        orderDate: DateTime.now(),
        total: _totalAmount,
        paymentMethod: _selectedPaymentMethod,
        paymentStatus:
            _selectedPaymentMethod == 'COD' ? 'Chưa thanh toán' : 'Đang xử lý',
        orderStatus: 'Đang xử lý',
        items: _orderItems,
      );

      final createdOrder = await _orderService.createOrder(order);

      if (createdOrder != null && mounted) {
        // Nếu từ giỏ hàng, xóa các items đã thanh toán
        if (widget.source == CheckoutSource.cart) {
          // Xóa từng item đã thanh toán khỏi giỏ hàng
          for (final item in _orderItems) {
            if (item.id != null) {
              await _cartService.removeFromCart(item.id!);
              print(
                  '[Checkout] Removed cart item ${item.id} after successful order');
            }
          }
        }

        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đặt hàng thành công!'),
            backgroundColor: Colors.green,
          ),
        );

        // Quay về dashboard hoặc trang đơn hàng
        Navigator.of(context).popUntil((route) => route.isFirst);
      } else {
        throw Exception(_orderService.lastError ?? 'Không thể tạo đơn hàng');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _noteController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán đơn hàng'),
        backgroundColor: const Color(0xFFE91E63),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Địa chỉ giao hàng
                  _buildSection(
                    title: 'Phương thức giao hàng',
                    child: TextField(
                      controller: _addressController,
                      decoration: const InputDecoration(
                        hintText:
                            'Nhập địa chỉ để xem các phương thức giao hàng',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.all(12),
                      ),
                      maxLines: 2,
                    ),
                  ),

                  const Divider(thickness: 8, color: Color(0xFFF5F5F5)),

                  // Phương thức thanh toán
                  _buildSection(
                    title: 'Phương thức thanh toán',
                    child: Column(
                      children: [
                        _buildPaymentOption(
                          icon: Icons.local_shipping,
                          title: 'Thanh toán khi giao hàng (COD)',
                          subtitle: 'Áp dụng ship COD trên toàn quốc',
                          value: 'COD',
                        ),
                        _buildPaymentOption(
                          icon: Icons.account_balance,
                          title: 'Chuyển khoản qua ngân hàng',
                          value: 'Bank',
                        ),
                        _buildPaymentOption(
                          icon: Icons.phone_android,
                          title:
                              'Thanh toán online qua ứng dụng\nZaloPay bằng QRCode',
                          value: 'ZaloPay',
                        ),
                      ],
                    ),
                  ),

                  const Divider(thickness: 8, color: Color(0xFFF5F5F5)),

                  // Hoá đơn điện tử (optional)
                  _buildSection(
                    title: 'Hoá đơn điện tử',
                    trailing: const Text(
                      'Yêu cầu xuất >',
                      style: TextStyle(color: Colors.grey),
                    ),
                    child: const SizedBox.shrink(),
                  ),

                  // Ghi chú đơn hàng
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: TextField(
                      controller: _noteController,
                      decoration: const InputDecoration(
                        hintText: 'Ghi chú đơn hàng',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.all(12),
                      ),
                      maxLines: 2,
                    ),
                  ),

                  const Divider(thickness: 8, color: Color(0xFFF5F5F5)),

                  // Mã khuyến mãi
                  _buildSection(
                    title: 'Mã khuyến mãi',
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _couponController,
                            decoration: const InputDecoration(
                              prefixIcon: Icon(Icons.confirmation_number),
                              hintText: 'Nhập mã khuyến mãi',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () {
                            // TODO: Áp dụng mã giảm giá
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE91E63),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 24, vertical: 16),
                          ),
                          child: const Text('Áp dụng',
                              style: TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                  ),

                  const Divider(thickness: 8, color: Color(0xFFF5F5F5)),

                  // Tóm tắt đơn hàng
                  _buildSection(
                    title: 'Tóm tắt đơn hàng',
                    child: Column(
                      children: [
                        _buildSummaryRow('Tổng tiền hàng',
                            '${_totalAmount.toStringAsFixed(0)}đ'),
                        _buildSummaryRow('Phí vận chuyển', '-'),
                        const Divider(),
                        _buildSummaryRow(
                          'Tổng thanh toán',
                          '${_totalAmount.toStringAsFixed(0)}đ',
                          isBold: true,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Giá trên đã bao gồm VAT ${(_totalAmount * 0.074).toStringAsFixed(0)}đ',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 80), // Space for bottom button
                ],
              ),
            ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_totalAmount.toStringAsFixed(0)}đ',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: _isLoading ? null : _placeOrder,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE91E63),
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      'Đặt hàng',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    Widget? trailing,
    required Widget child,
  }) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (trailing != null) trailing,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _buildPaymentOption({
    required IconData icon,
    required String title,
    String? subtitle,
    required String value,
  }) {
    return RadioListTile<String>(
      value: value,
      groupValue: _selectedPaymentMethod,
      onChanged: (val) => setState(() => _selectedPaymentMethod = val!),
      title: Row(
        children: [
          Icon(icon, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title),
                if (subtitle != null)
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      activeColor: const Color(0xFFE91E63),
      contentPadding: EdgeInsets.zero,
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isBold ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isBold ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
