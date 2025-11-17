import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/order_model.dart';
import '../models/product_model.dart';
import '../models/membership_model.dart';
import '../models/cart_model.dart';
import '../models/coupon_model.dart';
import '../services/order_service.dart';
import '../services/cart_service.dart';
import '../services/address_service.dart';
import '../providers/auth_provider.dart';
import 'address_selection_screen.dart';
import 'coupon_selection_screen.dart';

enum CheckoutSource { buyNow, cart }

const Color kPrimaryBlue = Color(0xFF00B4D8);
const Color kLightBlue = Color(0xFFE3F2FD);
const Color kDarkBlue = Color(0xFF0277BD);

class CheckoutScreen extends StatefulWidget {
  final CheckoutSource source;
  final ProductVariant? variant;
  final int? quantity;
  final double? price;
  final Product? product;
  final List<int>? selectedItemIds;
  final int? sizeBridgeId;

  const CheckoutScreen({
    super.key,
    required this.source,
    this.variant,
    this.quantity,
    this.price,
    this.product,
    this.selectedItemIds,
    this.sizeBridgeId,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final OrderService _orderService = OrderService();
  final CartService _cartService = CartService();
  final AddressService _addressService = AddressService();
  final TextEditingController _noteController = TextEditingController();
  final NumberFormat _currencyFormatter =
      NumberFormat.currency(locale: 'vi_VN', symbol: ' VND', decimalDigits: 0);

  String _selectedPaymentMethod = 'COD';
  bool _isLoading = false;
  List<OrderItem> _orderItems = [];
  List<CheckoutProductSummary> _productSummaries = [];
  double _totalAmount = 0;
  double _shippingFee = 0;
  double _orderCouponDiscount = 0;
  double _shippingCouponDiscount = 0;
  Coupon? _selectedDiscountCoupon;
  Coupon? _selectedFreeshipCoupon;
  DiaChiKhachHang? _selectedAddress;

  double get _grandTotal =>
      math.max(0, _totalAmount - _orderCouponDiscount) +
      math.max(0, _shippingFee - _shippingCouponDiscount);

  @override
  void initState() {
    super.initState();
    _loadOrderItems();
    _loadDefaultAddress();
  }

  Future<void> _loadDefaultAddress() async {
    try {
      final auth = context.read<AuthProvider>();
      if (!auth.isAuthenticated || auth.user == null) return;

      final addresses =
          await _addressService.getAddresses(auth.user!.maKhachHang);
      if (addresses.isNotEmpty) {
        final defaultAddr = addresses.firstWhere(
          (addr) => addr.macDinh == true,
          orElse: () => addresses.first,
        );
        setState(() => _selectedAddress = defaultAddr);
      }
    } catch (e) {
      debugPrint('Error loading address: $e');
    }
  }


  Future<void> _loadOrderItems() async {
    setState(() => _isLoading = true);

    try {
      if (widget.source == CheckoutSource.buyNow) {
        if (widget.variant == null) {
          throw Exception('Thieu thong tin bien the san pham');
        }
        final quantity = widget.quantity ?? 1;
        final unitPrice = widget.price ?? widget.variant!.price;
        final orderItems = [
          OrderItem(
            variantId: widget.variant!.id,
            quantity: quantity,
            price: unitPrice,
            sizeBridgeId: widget.sizeBridgeId,
          ),
        ];
        final subtotal =
            orderItems.fold<double>(0, (sum, item) => sum + item.total);
        final viewModels = [
          CheckoutProductSummary.fromBuyNow(
            product: widget.product,
            variant: widget.variant!,
            quantity: quantity,
            unitPrice: unitPrice,
          ),
        ];

        if (!mounted) return;
        setState(() {
          _orderItems = orderItems;
          _productSummaries = viewModels;
          _totalAmount = subtotal;
          _orderCouponDiscount =
              _computeCouponValue(_selectedDiscountCoupon, forShipping: false);
          _shippingCouponDiscount =
              _computeCouponValue(_selectedFreeshipCoupon, forShipping: true);
        });
      } else {
        final cart = await _cartService.getCart();
        final selectedIds = widget.selectedItemIds ?? [];

        final filtered = cart.items
            .where(
              (item) => selectedIds.isEmpty || selectedIds.contains(item.id),
            )
            .toList();

        final orderItems = filtered
            .map(
              (item) => OrderItem(
                id: item.id,
                variantId: item.variantId,
                productId: item.variant?.product?.id,
                productName: item.variant?.product?.name,
                variantName: _formatVariantName(item),
                imageUrl: item.variant?.images.isNotEmpty == true
                    ? item.variant!.images.first.url
                    : null,
                quantity: item.quantity,
                price: item.price,
                sizeBridgeId: item.sizeBridgeId,
              ),
            )
            .toList();

        final subtotal =
            orderItems.fold<double>(0, (sum, item) => sum + item.total);
        final viewModels =
            filtered.map(CheckoutProductSummary.fromCartItem).toList();

        if (!mounted) return;
        setState(() {
          _orderItems = orderItems;
          _productSummaries = viewModels;
          _totalAmount = subtotal;
          _orderCouponDiscount =
              _computeCouponValue(_selectedDiscountCoupon, forShipping: false);
          _shippingCouponDiscount =
              _computeCouponValue(_selectedFreeshipCoupon, forShipping: true);
        });
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
    if (_selectedAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Vui long chon dia chi giao hang'),
          backgroundColor: Colors.orange[700],
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final auth = context.read<AuthProvider>();
      if (!auth.isAuthenticated || auth.user == null) {
        throw Exception('Chua dang nhap');
      }

      final order = Order(
        customerId: auth.user!.maKhachHang,
        orderDate: DateTime.now(),
        total: _grandTotal,
        paymentMethod: _selectedPaymentMethod,
        paymentStatus: _selectedPaymentMethod == 'COD'
            ? 'Chua thanh toan'
            : 'Da thanh toan',
        orderStatus:
            _selectedPaymentMethod == 'COD' ? 'Cho xac nhan' : 'Cho lay hang',
        items: _orderItems,
        shippingAddress: _selectedAddress,
      );

      final createdOrder = await _orderService.createOrder(order);

      if (createdOrder != null && mounted) {
        if (widget.source == CheckoutSource.cart) {
          for (final item in _orderItems) {
            if (item.id != null) {
              await _cartService.removeFromCart(item.id!);
            }
          }
        }

        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: const [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 12),
                Text('Dat hang thanh cong!'),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );

        Navigator.of(context).popUntil((route) => route.isFirst);
      } else {
        throw Exception(_orderService.lastError ?? 'Khong the tao don hang');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Loi: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  double _computeCouponValue(Coupon? coupon, {required bool forShipping}) {
    if (coupon == null) return 0;
    final type = coupon.discountType.toUpperCase();
    final isFreeship = type == 'FREESHIP';
    if (forShipping && !isFreeship) return 0;
    if (!forShipping && isFreeship) return 0;
    return coupon.calculateDiscount(_totalAmount, _shippingFee);
  }

  Future<void> _openCouponSelection() async {
    final result = await Navigator.push<CouponSelectionResult>(
      context,
      MaterialPageRoute(
        builder: (_) => CouponSelectionScreen(
          subtotal: _totalAmount,
          shippingFee: _shippingFee,
          initialDiscountCoupon: _selectedDiscountCoupon,
          initialFreeshipCoupon: _selectedFreeshipCoupon,
        ),
      ),
    );

    if (result != null) {
      setState(() {
        _selectedDiscountCoupon = result.discountCoupon;
        _selectedFreeshipCoupon = result.freeshipCoupon;
        _orderCouponDiscount =
            _computeCouponValue(_selectedDiscountCoupon, forShipping: false);
        _shippingCouponDiscount =
            _computeCouponValue(_selectedFreeshipCoupon, forShipping: true);
      });
    }
  }

  void _clearCouponSelection({required bool isShipping}) {
    setState(() {
      if (isShipping) {
        _selectedFreeshipCoupon = null;
        _shippingCouponDiscount = 0;
      } else {
        _selectedDiscountCoupon = null;
        _orderCouponDiscount = 0;
      }
    });
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        title: const Text('Thanh toan'),
        backgroundColor: kPrimaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  _buildCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: kLightBlue,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.location_on,
                                color: kPrimaryBlue,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'Dia chi giao hang',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildAddressSelector(),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  _buildProductsSection(),

                  const SizedBox(height: 12),

                  _buildCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: kLightBlue,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.payment,
                                color: kPrimaryBlue,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'Phuong thuc thanh toan',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildPaymentOption(
                          icon: Icons.local_shipping,
                          title: 'Thanh toan khi nhan hang (COD)',
                          subtitle: 'Ap dung toan quoc',
                          value: 'COD',
                        ),
                        const Divider(height: 8),
                        _buildPaymentOption(
                          icon: Icons.account_balance,
                          title: 'Chuyen khoan ngan hang',
                          subtitle: 'Mien phi giao dich',
                          value: 'Bank',
                        ),
                        
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  _buildCouponSection(),

                  const SizedBox(height: 12),

                  _buildCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: kLightBlue,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.receipt_long,
                                color: kPrimaryBlue,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'Chi tiet thanh toan',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildSummaryRow(
                          'Tong tien hang',
                          _formatCurrency(_totalAmount),
                        ),
                        const SizedBox(height: 8),
                        _buildSummaryRow(
                          'Giam gia don hang',
                          _orderCouponDiscount > 0
                              ? '-${_formatCurrency(_orderCouponDiscount)}'
                              : '-${_formatCurrency(0)}',
                          valueColor: _orderCouponDiscount > 0
                              ? Colors.redAccent
                              : Colors.black87,
                        ),
                        const SizedBox(height: 8),
                        _buildSummaryRow(
                          'Phi van chuyen',
                          _formatCurrency(_shippingFee),
                        ),
                        if (_shippingCouponDiscount > 0) ...[
                          const SizedBox(height: 8),
                          _buildSummaryRow(
                            'Giam phi van chuyen',
                            '-${_formatCurrency(_shippingCouponDiscount)}',
                            valueColor: Colors.redAccent,
                          ),
                        ],
                        const Divider(height: 24),
                        _buildSummaryRow(
                          'Tong thanh toan',
                          _formatCurrency(_grandTotal),
                          isBold: true,
                          isTotal: true,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 12,
              offset: const Offset(0, -4),
            ),
          ],
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(20),
          ),
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tong thanh toan',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatCurrency(_grandTotal),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: kPrimaryBlue,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _placeOrder,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimaryBlue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : const Text(
                          'Dat hang',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),

    );
  }

  Widget _buildProductsSection() {
    return _buildCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: kLightBlue,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.shopping_bag_outlined,
                  color: kPrimaryBlue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'San pham',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_productSummaries.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'Khong co san pham nao duoc chon',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemBuilder: (context, index) =>
                  _buildProductItem(_productSummaries[index]),
              separatorBuilder: (_, __) => const Divider(height: 24),
              itemCount: _productSummaries.length,
            ),
          const SizedBox(height: 16),
          const Text(
            'Ghi chu cho don hang (tuy chon)',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _noteController,
            decoration: InputDecoration(
              hintText: 'Vi du: Giao gio hanh chinh',
              hintStyle: TextStyle(
                fontSize: 14,
                color: Colors.grey[400],
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey[300]!),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey[300]!),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                  color: kPrimaryBlue,
                  width: 2,
                ),
              ),
              contentPadding: const EdgeInsets.all(16),
              filled: true,
              fillColor: Colors.grey[50],
            ),
            maxLines: 2,
          ),
        ],
      ),
    );
  }

  Widget _buildProductItem(CheckoutProductSummary item) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Container(
            width: 70,
            height: 70,
            color: Colors.grey[100],
            child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                ? Image.network(
                    item.imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(Icons.image),
                  )
                : Icon(
                    Icons.image_not_supported_outlined,
                    color: Colors.grey[400],
                  ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.name,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (item.variantLabel != null)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    item.variantLabel!,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.only(top: 6, bottom: 2),
                child: Row(
                  children: [
                    Text(
                      'SL: ${item.quantity}',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[700],
                      ),
                    ),
                    const Spacer(),
                    Text(
                      _formatCurrency(item.lineTotal),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: kDarkBlue,
                      ),
                    ),
                  ],
                ),
              ),
              if (item.originalPrice != null &&
                  item.originalPrice! > item.unitPrice)
                Text(
                  _formatCurrency(item.originalPrice!),
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
              if (item.promotionLabel != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: kLightBlue,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      item.promotionLabel!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: kPrimaryBlue,
                      ),
                    ),
                  ),
                ),
              if (item.giftName != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Row(
                    children: [
                      Icon(
                        Icons.card_giftcard,
                        size: 16,
                        color: Colors.pink[300],
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          item.giftVariantLabel != null
                              ? '${item.giftName!} (${item.giftVariantLabel})'
                              : item.giftName!,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCouponSection() {

    final hasDiscount = _selectedDiscountCoupon != null;

    final hasFreeship = _selectedFreeshipCoupon != null;

    return _buildCard(

      child: Column(

        crossAxisAlignment: CrossAxisAlignment.start,

        children: [

          Row(

            children: [

              Container(

                padding: const EdgeInsets.all(8),

                decoration: BoxDecoration(

                  color: kLightBlue,

                  borderRadius: BorderRadius.circular(8),

                ),

                child: const Icon(

                  Icons.discount_outlined,

                  color: kPrimaryBlue,

                  size: 20,

                ),

              ),

              const SizedBox(width: 12),

              const Text(

                'Ma giam gia',

                style: TextStyle(

                  fontSize: 16,

                  fontWeight: FontWeight.w600,

                ),

              ),

            ],

          ),

          const SizedBox(height: 12),

          if (!hasDiscount && !hasFreeship)

            Text(

              'Ban chua chon ma giam gia nao.',

              style: TextStyle(

                fontSize: 14,

                color: Colors.grey[600],

              ),

            ),

          if (hasDiscount)

            _buildSelectedCouponRow(

              coupon: _selectedDiscountCoupon!,

              discountValue: _orderCouponDiscount,

              label: 'Giam gia don hang',

              onRemove: () => _clearCouponSelection(isShipping: false),

            ),

          if (hasFreeship)

            _buildSelectedCouponRow(

              coupon: _selectedFreeshipCoupon!,

              discountValue: _shippingCouponDiscount,

              label: 'Giam phi van chuyen',

              onRemove: () => _clearCouponSelection(isShipping: true),

            ),

          const SizedBox(height: 16),

          OutlinedButton.icon(

            onPressed: _openCouponSelection,

            icon: const Icon(Icons.local_offer_outlined),

            label: const Text('Chon / nhap ma giam gia'),

            style: OutlinedButton.styleFrom(

              foregroundColor: kPrimaryBlue,

              side: const BorderSide(color: kPrimaryBlue),

              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),

              shape: RoundedRectangleBorder(

                borderRadius: BorderRadius.circular(12),

              ),

            ),

          ),

        ],

      ),

    );

  }



  Widget _buildSelectedCouponRow({

    required Coupon coupon,

    required double discountValue,

    required String label,

    required VoidCallback onRemove,

  }) {

    final applied = discountValue > 0;

    return Container(

      margin: const EdgeInsets.only(top: 8),

      padding: const EdgeInsets.all(12),

      decoration: BoxDecoration(

        color: kLightBlue.withOpacity(0.3),

        borderRadius: BorderRadius.circular(12),

        border: Border.all(color: kPrimaryBlue.withOpacity(0.2)),

      ),

      child: Row(

        children: [

          Expanded(

            child: Column(

              crossAxisAlignment: CrossAxisAlignment.start,

              children: [

                Text(

                  label,

                  style: const TextStyle(

                    fontSize: 13,

                    color: kDarkBlue,

                    fontWeight: FontWeight.w500,

                  ),

                ),

                const SizedBox(height: 4),

                Text(

                  coupon.code,

                  style: const TextStyle(

                    fontSize: 15,

                    fontWeight: FontWeight.w600,

                  ),

                ),

                const SizedBox(height: 4),

                Text(

                  _couponValueLabel(coupon),

                  style: TextStyle(

                    fontSize: 13,

                    color: Colors.grey[700],

                  ),

                ),

                if (!applied)

                  Padding(

                    padding: const EdgeInsets.only(top: 2),

                    child: Text(

                      'Chua du dieu kien ap dung',

                      style: TextStyle(

                        fontSize: 12,

                        color: Colors.red[400],

                      ),

                    ),

                  ),

              ],

            ),

          ),

          Column(

            crossAxisAlignment: CrossAxisAlignment.end,

            children: [

              Text(

                applied

                    ? '-${_formatCurrency(discountValue)}'

                    : '-${_formatCurrency(0)}',

                style: const TextStyle(

                  fontSize: 15,

                  fontWeight: FontWeight.w600,

                  color: kPrimaryBlue,

                ),

              ),

              IconButton(

                onPressed: onRemove,

                icon: const Icon(Icons.close_rounded, size: 18),

                color: Colors.grey[600],

                tooltip: 'Bo chon',

              ),

            ],

          ),

        ],

      ),

    );

  }



  String _couponValueLabel(Coupon coupon) {
    switch (coupon.discountType) {
      case 'PERCENT':
        final percent = coupon.percent?.toStringAsFixed(0) ?? '0';
        final cap = coupon.maxDiscountAmount;
        final capText =
            cap != null && cap > 0 ? ' (toi da ${_formatCurrency(cap)})' : '';
        return 'Giam $percent%$capText';
      case 'FREESHIP':
        final cap = coupon.maxDiscountAmount;
        if (cap != null && cap > 0) {
          return 'Freeship den ${_formatCurrency(cap)}';
        }
        return 'Freeship';
      default:
        return 'Giam ${_formatCurrency(coupon.fixedAmount ?? 0)}';
    }
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildAddressSelector() {
    return InkWell(
      onTap: () async {
        final auth = context.read<AuthProvider>();
        if (auth.user == null) return;

        final result = await Navigator.push<DiaChiKhachHang>(
          context,
          MaterialPageRoute(
            builder: (context) => AddressSelectionScreen(
              customerId: auth.user!.maKhachHang,
              selectedAddress: _selectedAddress,
            ),
          ),
        );

        if (result != null) {
          setState(() => _selectedAddress = result);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: kLightBlue.withOpacity(0.3),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: kPrimaryBlue.withOpacity(0.3),
            width: 1.5,
          ),
        ),
        child: _selectedAddress == null
            ? Row(
                children: [
                  const Icon(
                    Icons.add_location_alt,
                    color: kPrimaryBlue,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Them dia chi giao hang',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: kDarkBlue,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: Colors.grey[400],
                  ),
                ],
              )
            : _buildAddressContent(),
      ),
    );
  }

  Widget _buildAddressContent() {
    final address = _selectedAddress!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (address.ten?.isNotEmpty == true)
                    Text(
                      address.ten!,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  if (address.soDienThoai?.isNotEmpty == true)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        address.soDienThoai!,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            TextButton.icon(
              onPressed: () async {
                final auth = context.read<AuthProvider>();
                if (auth.user == null) return;

                final result = await Navigator.push<DiaChiKhachHang>(
                  context,
                  MaterialPageRoute(
                    builder: (context) => AddressSelectionScreen(
                      customerId: auth.user!.maKhachHang,
                      selectedAddress: _selectedAddress,
                    ),
                  ),
                );

                if (result != null) {
                  setState(() => _selectedAddress = result);
                }
              },
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              icon: const Icon(Icons.edit, size: 16),
              label: const Text(
                'Sua',
                style: TextStyle(fontSize: 13),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(
                Icons.location_on_outlined,
                size: 18,
                color: Colors.grey[600],
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _getFormattedAddress(address),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getFormattedAddress(DiaChiKhachHang address) {
    final parts = <String>[];
    if (address.diaChiCuThe?.isNotEmpty == true) {
      parts.add(address.diaChiCuThe!);
    }
    if (address.phuong?.isNotEmpty == true) {
      parts.add(address.phuong!);
    }
    if (address.tinh?.isNotEmpty == true) {
      parts.add(address.tinh!);
    }
    if (parts.isNotEmpty) {
      return parts.join(', ');
    }
    return address.diaChi ?? 'Chua co dia chi';
  }

  Widget _buildPaymentOption({
    required IconData icon,
    required String title,
    String? subtitle,
    required String value,
  }) {
    final isSelected = _selectedPaymentMethod == value;
    return InkWell(
      onTap: () => setState(() => _selectedPaymentMethod = value),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isSelected
                    ? kPrimaryBlue.withOpacity(0.1)
                    : Colors.grey[100],
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                size: 24,
                color: isSelected ? kPrimaryBlue : Colors.grey[600],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                      color: isSelected ? Colors.black87 : Colors.black54,
                    ),
                  ),
                  if (subtitle != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Radio<String>(
              value: value,
              groupValue: _selectedPaymentMethod,
              onChanged: (val) => setState(() => _selectedPaymentMethod = val!),
              activeColor: kPrimaryBlue,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(
    String label,
    String value, {
    bool isBold = false,
    bool isTotal = false,
    Color? valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isBold ? FontWeight.w600 : FontWeight.normal,
            color: isTotal ? Colors.black87 : Colors.grey[700],
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 18 : 14,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            color: valueColor ??
                (isTotal ? const Color.fromARGB(255, 0, 0, 216) : Colors.black87),
          ),
        ),
      ],
    );
  }

  String? _formatVariantName(CartItem item) {
    final variant = item.variant;
    if (variant == null) return null;
    final parts = <String>[];
    if (variant.color?.isNotEmpty == true) {
      parts.add(variant.color!);
    }
    if (variant.size?.isNotEmpty == true) {
      parts.add('Size ${variant.size}');
    }
    return parts.isEmpty ? null : parts.join(' - ');
  }

  String _formatCurrency(double value) => _currencyFormatter.format(value);
}

class CheckoutProductSummary {
  final String name;
  final String? variantLabel;
  final String? imageUrl;
  final int quantity;
  final double unitPrice;
  final double lineTotal;
  final double? originalPrice;
  final String? promotionLabel;
  final String? giftName;
  final String? giftVariantLabel;

  CheckoutProductSummary({
    required this.name,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
    this.variantLabel,
    this.imageUrl,
    this.originalPrice,
    this.promotionLabel,
    this.giftName,
    this.giftVariantLabel,
  });

  factory CheckoutProductSummary.fromCartItem(CartItem item) {
    final productName = item.variant?.product?.name ?? 'San pham';
    final variantParts = <String>[];
    if (item.variant?.color?.isNotEmpty == true) {
      variantParts.add(item.variant!.color!);
    }
    if (item.variant?.size?.isNotEmpty == true) {
      variantParts.add('Size ${item.variant!.size}');
    }
    final displayVariant =
        variantParts.isEmpty ? null : variantParts.join(' - ');
    final imageUrl = (item.variant?.images.isNotEmpty ?? false)
        ? item.variant!.images.first.url
        : null;

    return CheckoutProductSummary(
      name: productName,
      variantLabel: displayVariant,
      imageUrl: imageUrl,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.price * item.quantity,
      originalPrice: item.originalPrice ?? item.variant?.price,
      promotionLabel: item.promotionLabel,
      giftName: item.giftProductName,
      giftVariantLabel: item.giftVariantLabel,
    );
  }

  factory CheckoutProductSummary.fromBuyNow({
    Product? product,
    required ProductVariant variant,
    required int quantity,
    required double unitPrice,
  }) {
    final imageUrl =
        variant.images.isNotEmpty ? variant.images.first.url : product?.coverImage;
    return CheckoutProductSummary(
      name: product?.name ?? 'San pham',
      variantLabel: variant.displayName,
      imageUrl: imageUrl,
      quantity: quantity,
      unitPrice: unitPrice,
      lineTotal: unitPrice * quantity,
      originalPrice: variant.price,
    );
  }
}
