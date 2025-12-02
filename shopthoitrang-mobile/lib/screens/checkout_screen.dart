import 'dart:math' as math;
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
// import 'package:url_launcher/url_launcher.dart';

import 'sepay_checkout_screen.dart';
import 'momo_payment_screen.dart';
import 'dashboard_screen.dart';

import '../models/order_model.dart';
import '../models/product_model.dart';
import '../models/membership_model.dart';
import '../models/cart_model.dart';
import '../models/coupon_model.dart';
import '../models/shipping_config.dart';
import '../services/order_service.dart';
import '../services/cart_service.dart';
import '../services/address_service.dart';
import '../services/payment_service.dart';
import '../services/shipping_service.dart';
import '../services/membership_service.dart';
import '../providers/auth_provider.dart';
import 'address_selection_screen.dart';
import 'coupon_selection_screen.dart';
import '../utils/order_gift_cache.dart';

enum CheckoutSource { buyNow, cart }

const Color kPrimaryBlue = Color(0xFF00B4D8);
const Color kLightBlue = Color(0xFFE3F2FD);
const Color kDarkBlue = Color(0xFF0277BD);
const double kPointValueInVnd = 1;

class CheckoutScreen extends StatefulWidget {
  final CheckoutSource source;
  final ProductVariant? variant;
  final int? quantity;
  final double? price;
  final Product? product;
  final List<int>? selectedItemIds;
  final int? sizeBridgeId;
  final CartGiftOption? buyNowGiftOption;

  const CheckoutScreen({
    super.key,
    required this.source,
    this.variant,
    this.quantity,
    this.price,
    this.product,
    this.selectedItemIds,
    this.sizeBridgeId,
    this.buyNowGiftOption,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  static const String _momoCancelMessage =
      'Thanh toán chuyển khoản thất bại, đặt hàng không thành công. Vui lòng đặt hàng và chọn phương thức thanh toán khác để khỏi tạo đơn đỡ phải xử lý.';

  final OrderService _orderService = OrderService();
  final CartService _cartService = CartService();
  final AddressService _addressService = AddressService();
  final PaymentService _paymentService = PaymentService();
  final ShippingService _shippingService = ShippingService();
  final MembershipService _membershipService = MembershipService();

  final TextEditingController _noteController = TextEditingController();
  final TextEditingController _pointsController = TextEditingController();

  final NumberFormat _currencyFormatter =
      NumberFormat.currency(locale: 'vi_VN', symbol: ' VND', decimalDigits: 0);
  final NumberFormat _pointsFormatter =
      NumberFormat.decimalPattern('vi_VN');

  String _selectedPaymentMethod = 'COD';
  int? _provisionalOrderId; // reuse existing order instead of creating a new one
  bool _isLoading = false;

  List<OrderItem> _orderItems = [];
  List<CheckoutProductSummary> _productSummaries = [];

  double _totalAmount = 0;
  double _shippingFee = 0;
  double _orderCouponDiscount = 0;
  double _shippingCouponDiscount = 0;

  ShippingConfig? _shippingConfig;
  Coupon? _selectedDiscountCoupon;
  Coupon? _selectedFreeshipCoupon;
  DiaChiKhachHang? _selectedAddress;
  PointsSummary? _pointsSummary;
  int _pointsToUse = 0;

  double get _subtotalAfterDiscounts =>
      math.max(0, _totalAmount - _orderCouponDiscount);

  double get _shippingAfterDiscounts =>
      math.max(0, _shippingFee - _shippingCouponDiscount);

  double get _prePointTotal => _subtotalAfterDiscounts + _shippingAfterDiscounts;

  int get _availablePoints => (_pointsSummary?.diemHienTai ?? 0).floor();

  int get _maxPointsCanUse => _availablePoints;

  int get _maxPointsCoverableByTotal {
    if (_prePointTotal <= 0) return 0;
    return math.max(0, (_prePointTotal / kPointValueInVnd).floor());
  }

  int get _redeemableCap =>
      math.max(0, math.min(_availablePoints, _maxPointsCoverableByTotal));

  int get _effectivePointsToUse =>
      math.max(0, math.min(_pointsToUse, _redeemableCap));

  double get _pointsDiscountValue =>
      math.min(_prePointTotal, _effectivePointsToUse * kPointValueInVnd);

  double get _grandTotal => math.max(0, _prePointTotal - _pointsDiscountValue);

  @override
  void initState() {
    super.initState();
    _loadOrderItems();
    _loadDefaultAddress();
    _loadShippingConfig();
    _loadPointsSummary();
    _restoreCheckoutIfAny();
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
        _recalculateShippingFee(address: defaultAddr);
      }
    } catch (e) {
      debugPrint('Error loading address: $e');
    }
  }

  Future<void> _loadShippingConfig() async {
    try {
      final config = await _shippingService.getConfig();
      if (!mounted) return;
      setState(() {
        _shippingConfig = config;
      });
      _recalculateShippingFee(address: _selectedAddress, config: config);
    } catch (e) {
      debugPrint('Error loading shipping config: $e');
    }
  }

  Future<void> _loadPointsSummary() async {
    try {
      final auth = context.read<AuthProvider>();
      final user = auth.user;
      if (user == null) return;
      final summary =
          await _membershipService.getPointsSummary(user.maKhachHang);
      if (!mounted) return;
      setState(() {
        _pointsSummary = summary;
        _clampPointsUsageLocked();
      });
    } catch (e) {
      debugPrint('Error loading points summary: $e');
    }
  }

  void _recalculateShippingFee({
    DiaChiKhachHang? address,
    ShippingConfig? config,
  }) {
    final cfg = config ?? _shippingConfig;
    final targetAddress = address ?? _selectedAddress;
    if (cfg == null || !cfg.isActive || targetAddress == null) {
      setState(() {
        _shippingFee = 0;
        _shippingCouponDiscount =
            _computeCouponValue(_selectedFreeshipCoupon, forShipping: true);
        _clampPointsUsageLocked();
      });
      return;
    }
    final fee = cfg.feeForProvince(targetAddress.tinh);
    setState(() {
      _shippingFee = fee;
      _shippingCouponDiscount =
          _computeCouponValue(_selectedFreeshipCoupon, forShipping: true);
      _clampPointsUsageLocked();
    });
  }

  Future<void> _loadOrderItems() async {
    setState(() => _isLoading = true);

    try {
      if (widget.source == CheckoutSource.buyNow) {
        if (widget.variant == null) {
          throw Exception('Thiếu thông tin sản phẩm để đặt hàng ngay');
        }
        final quantity = widget.quantity ?? 1;
        final unitPrice = widget.price ?? widget.variant!.price;
        final opt = widget.buyNowGiftOption;
        final giftQty = _calculateGiftQuantity(opt, quantity);

        final orderItems = [
          OrderItem(
            variantId: widget.variant!.id,
            quantity: quantity,
            price: unitPrice,
            sizeBridgeId: widget.sizeBridgeId,
            giftVariantId: opt?.variantId,
            giftSizeBridgeId: opt?.sizeBridgeId,
            giftQuantity: giftQty,
            giftPromotionId: opt?.promoId,
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
            giftOption: opt,
            giftQuantity: giftQty,
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
          _clampPointsUsageLocked();
        });
      } else {
        final cart = await _cartService.getCart();
        final selectedIds = widget.selectedItemIds ?? [];

        final filtered = cart.items
            .where(
              (item) => selectedIds.isEmpty || selectedIds.contains(item.id),
            )
            .toList();

        final orderItems = filtered.map((item) {
          final selectedGift = item.selectedGiftOption;
          final giftVariantId = item.selectedGiftVariantId ??
              selectedGift?.variantId ??
              item.giftProduct?.id;
          final giftSizeBridgeId =
              item.selectedGiftSizeBridgeId ?? selectedGift?.sizeBridgeId;
          final giftPromotionId = selectedGift?.promoId;
          final giftQty = item.giftRewardQuantity;

          return OrderItem(
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
            giftVariantId: giftVariantId,
            giftSizeBridgeId: giftSizeBridgeId,
            giftQuantity: giftQty,
            giftPromotionId: giftPromotionId,
          );
        }).toList();

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
          _clampPointsUsageLocked();
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

  int _calculateGiftQuantity(CartGiftOption? option, int orderedQty) {
    if (option == null) return 0;
    if (orderedQty <= 0) return 0;
    final requiredBuy = option.buyQty > 0 ? option.buyQty : 1;
    final reward = option.giftQty > 0 ? option.giftQty : 0;
    if (reward == 0) return 0;
    final eligibleSets = orderedQty ~/ requiredBuy;
    if (eligibleSets <= 0) return 0;
    final total = eligibleSets * reward;
    if (option.eligibleQuantity > 0) {
      return math.min(total, option.eligibleQuantity);
    }
    return total;
  }

  Future<void> _placeOrder() async {
    if (_selectedAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Vui lòng chọn địa chỉ giao hàng'),
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
        throw Exception('Chưa đăng nhập');
      }

      final bool isCod = _selectedPaymentMethod == 'COD';
      final bool requiresGateway =
          _selectedPaymentMethod == 'Bank' || _selectedPaymentMethod == 'MOMO';

      final order = Order(
        customerId: auth.user!.maKhachHang,
        orderDate: DateTime.now(),
        total: _grandTotal,
        paymentMethod: _selectedPaymentMethod,
        paymentStatus: 'Chưa thanh toán',
        orderStatus: 'Chờ xác nhận',
        items: _orderItems,
        shippingAddress: _selectedAddress,
        shippingFee: _shippingFee,
        shippingProvinceSnapshot: _selectedAddress?.tinh,
        appliedVoucherIds: _collectVoucherIds(),
        pointsUsed: _effectivePointsToUse,
        pointsDiscountValue: _pointsDiscountValue,
      );

      // Tạo / cập nhật đơn tạm để dùng lại cho MoMo / SePay
      Order? createdOrder;
      if (_provisionalOrderId != null) {
        final updated =
            await _orderService.updateOrder(_provisionalOrderId!, order);
        if (updated == null) {
          throw Exception(
              _orderService.lastError ?? 'Không thể cập nhật đơn hiện tại');
        }
        createdOrder = updated;
      } else {
        createdOrder = await _orderService.createOrder(order);
        if (createdOrder?.id != null) {
          _provisionalOrderId = createdOrder!.id;
          await _persistCheckoutState(
            orderId: _provisionalOrderId!,
            paymentMethod: _selectedPaymentMethod,
          );
        }
      }

      if (createdOrder != null && mounted) {
        // Lưu thông tin quà tặng (nếu có)
        if (createdOrder.id != null) {
          final gifts = <OrderGiftCacheEntry>[];
          for (var i = 0;
              i < _orderItems.length && i < _productSummaries.length;
              i++) {
            final summary = _productSummaries[i];
            final item = _orderItems[i];
            if (summary.giftName != null) {
              gifts.add(
                OrderGiftCacheEntry(
                  orderId: createdOrder.id!,
                  parentVariantId: item.variantId,
                  giftName: summary.giftName!,
                  variantLabel: summary.giftVariantLabel,
                  imageUrl: summary.giftImageUrl,
                  quantity: summary.giftQuantity ?? 0,
                ),
              );
            }
          }
          if (gifts.isNotEmpty) {
            await OrderGiftCache.save(createdOrder.id!, gifts);
          }
        }

        // Xoá item khỏi giỏ nếu đặt từ giỏ hàng
        if (widget.source == CheckoutSource.cart) {
          for (final item in _orderItems) {
            if (item.id != null) {
              await _cartService.removeFromCart(item.id!);
            }
          }
        }

        if (!mounted) return;

        // Thanh toán online (SePay / MoMo)
        if (requiresGateway && createdOrder.id != null) {
          await _startOnlinePayment(createdOrder);
          return;
        }

        // COD
        if (isCod && mounted) {
          // nếu đơn trước đó đang là MoMo mà giờ chọn COD thì update lại trên server
          if (_provisionalOrderId != null) {
            await _orderService.updatePaymentMethod(_provisionalOrderId!, 'COD');
          }
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: const [
                  Icon(Icons.check_circle, color: Colors.white),
                  SizedBox(width: 12),
                  Text('Đặt hàng thành công!'),
                ],
              ),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }

        // Clear trạng thái tạm sau khi xong
        _provisionalOrderId = null;
        await _clearCheckoutState();
        Navigator.of(context).popUntil((route) => route.isFirst);
      } else {
        throw Exception(_orderService.lastError ?? 'Không thể tạo đơn hàng');
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

  List<int> _collectVoucherIds() {
    final ids = <int>[];
    void addCoupon(Coupon? coupon) {
      final id = coupon?.id;
      if (id != null) ids.add(id);
    }

    addCoupon(_selectedDiscountCoupon);
    addCoupon(_selectedFreeshipCoupon);
    return ids;
  }

  Future<void> _startOnlinePayment(Order order) async {
    final orderId = order.id;
    if (orderId == null) return;

    if (_selectedPaymentMethod == 'MOMO') {
      final momoPayload =
          await _paymentService.createMomoPayment(orderId: orderId);
      if (momoPayload == null || momoPayload.launchUrl == null) {
        throw Exception(_paymentService.lastError ??
            'Không thể mở MoMo. Vui lòng thử lại.');
      }
      if (!mounted) return;
      if (_isLoading) setState(() => _isLoading = false);

      await _persistCheckoutState(
        orderId: orderId,
        paymentMethod: 'MOMO',
        payUrl: momoPayload.launchUrl!,
      );

      final result = await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => MomoPaymentScreen(
            orderId: orderId,
            qrOrPayUrl: momoPayload.launchUrl!,
            // Give users and IPN more time (10 minutes)
            timeout: const Duration(minutes: 10),
          ),
        ),
      );

      if (!mounted) return;

      if (result == true) {
        // Payment succeeded: clear state and go to Orders tab
        await _clearCheckoutState();
        if (!mounted) return;
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (_) => const DashboardScreen(
              initialIndex: 3,
              initialOrdersStatus: 'Chờ lấy hàng',
            ),
          ),
          (route) => route.isFirst,
        );
        return;
      }

      if (result == 'cancel') {
        await _handleMomoCancellation(orderId);
      }
      return;
    } else {
      // SePay
      final paymentPayload = await _paymentService.createSepayPayment(
        orderId: orderId,
        customerName: _selectedAddress?.ten,
        customerPhone: _selectedAddress?.soDienThoai,
      );

      if (paymentPayload == null) {
        throw Exception(
          _paymentService.lastError ??
              'Không thể mở cổng thanh toán. Vui lòng thử lại.',
        );
      }

      if (paymentPayload.hasHtml || paymentPayload.launchUrl != null) {
        if (!mounted) return;
        if (_isLoading) {
          setState(() => _isLoading = false);
        }

        await _persistCheckoutState(
          orderId: orderId,
          paymentMethod: 'Bank',
          payUrl: paymentPayload.launchUrl,
        );

        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => SepayCheckoutScreen(
              initialHtml: paymentPayload.autoSubmitHtml,
              initialUrl:
                  paymentPayload.hasHtml ? null : paymentPayload.launchUrl,
              fallbackUrl: paymentPayload.launchUrl,
            ),
          ),
        );
        return;
      }

      throw Exception('Không tìm thấy đường dẫn thanh toán hợp lệ.');
    }
  }

  Future<void> _handleMomoCancellation(int orderId) async {
    final deleted = await _orderService.deleteOrder(orderId);
    if (!deleted) {
      await _orderService.updateOrderStatus(
        orderId,
        orderStatus: 'Đã huỷ',
        paymentStatus: 'Chưa thanh toán',
      );
    }
    await _clearCheckoutState();
    if (!mounted) return;
    setState(() {
      if (_provisionalOrderId == orderId) {
        _provisionalOrderId = null;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: const Text(_momoCancelMessage)),
    );
  }

  Future<void> _persistCheckoutState({
    required int orderId,
    required String paymentMethod,
    String? payUrl,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      prefs.setInt('provisional_order_id', orderId);
      final map = {
        'paymentMethod': paymentMethod,
        if (payUrl != null) 'payUrl': payUrl,
        'savedAt': DateTime.now().toIso8601String(),
      };
      prefs.setString('checkout_in_progress', json.encode(map));
    } catch (e) {
      debugPrint('Persist checkout state failed: $e');
    }
  }

  Future<Map<String, dynamic>?> _readCheckoutState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final id = prefs.getInt('provisional_order_id');
      final raw = prefs.getString('checkout_in_progress');
      if (id == null || raw == null) return null;
      final map = json.decode(raw) as Map<String, dynamic>;
      map['orderId'] = id;
      return map;
    } catch (_) {
      return null;
    }
  }

  Future<void> _clearCheckoutState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('provisional_order_id');
      await prefs.remove('checkout_in_progress');
    } catch (e) {
      debugPrint('Clear checkout state failed: $e');
    }
  }

  Future<void> _restoreCheckoutIfAny() async {
    final state = await _readCheckoutState();
    if (state == null) return;
    final orderId = state['orderId'] as int;
    try {
      final detail = await _orderService.getOrderById(orderId);
      if (detail == null) {
        await _clearCheckoutState();
        return;
      }
      final paid =
          (detail.paymentStatus.toLowerCase()).contains('da thanh toan');
      if (paid) {
        await _clearCheckoutState();
        return;
      }
      setState(() {
        _provisionalOrderId = orderId;
        _selectedPaymentMethod =
            state['paymentMethod'] as String? ?? detail.paymentMethod;
      });
      final payUrl = state['payUrl'] as String?;
      // Auto reopen MoMo payment screen if still in progress
      if (mounted &&
          _selectedPaymentMethod == 'MOMO' &&
          payUrl != null &&
          payUrl.isNotEmpty) {
        WidgetsBinding.instance.addPostFrameCallback((_) async {
          final result = await Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => MomoPaymentScreen(
                orderId: orderId,
                qrOrPayUrl: payUrl,
                timeout: const Duration(minutes: 10),
              ),
            ),
          );
          if (!mounted) return;
          if (result == true) {
            await _clearCheckoutState();
            if (!mounted) return;
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(
                builder: (_) => const DashboardScreen(
                  initialIndex: 3,
                  initialOrdersStatus: 'Chờ lấy hàng',
                ),
              ),
              (route) => route.isFirst,
            );
          }
        });
      }
    } catch (e) {
      debugPrint('Restore checkout failed: $e');
    }
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
        _clampPointsUsageLocked();
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
      _clampPointsUsageLocked();
    });
  }

  void _handlePointInput(String value) {
    final parsed = int.tryParse(value) ?? 0;
    final clamped = math.max(0, math.min(parsed, _maxPointsCanUse));
    setState(() {
      _pointsToUse = clamped;
    });
    if (parsed != clamped) {
      _syncPointsInput();
    }
  }

  void _applyMaxPoints() {
    final maxAllowed = _maxPointsCanUse;
    if (maxAllowed <= 0) {
      _clearPointsUsage();
      return;
    }
    setState(() {
      _pointsToUse = maxAllowed;
    });
    _syncPointsInput();
  }

  void _clearPointsUsage() {
    if (_pointsToUse == 0) {
      _pointsController.clear();
      return;
    }
    setState(() {
      _pointsToUse = 0;
    });
    _pointsController.clear();
  }

  void _syncPointsInput() {
    final text = _pointsToUse > 0 ? _pointsToUse.toString() : '';
    if (_pointsController.text != text) {
      _pointsController.value = TextEditingValue(
        text: text,
        selection: TextSelection.collapsed(offset: text.length),
      );
    }
  }

  void _clampPointsUsageLocked() {
    final clamped = math.max(0, math.min(_pointsToUse, _maxPointsCanUse));
    if (clamped != _pointsToUse) {
      _pointsToUse = clamped;
      final text = clamped > 0 ? clamped.toString() : '';
      if (_pointsController.text != text) {
        _pointsController.value = TextEditingValue(
          text: text,
          selection: TextSelection.collapsed(offset: text.length),
        );
      }
    }
  }

  @override
  void dispose() {
    _noteController.dispose();
    _pointsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final bool isLoggedIn = auth.isAuthenticated && auth.user != null;
    final bool canSubmitOrder = !_isLoading && _selectedAddress != null;

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
                            Text.rich(
                              TextSpan(
                                text: 'Dia chi giao hang',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                                children: const [
                                  TextSpan(
                                    text: ' *',
                                    style: TextStyle(
                                      color: Colors.red,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            )
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
                        const Divider(height: 8),
                        _buildPaymentOption(
                          icon: Icons.account_balance_wallet_outlined,
                          title: 'Chuyen khoan MOMO',
                          subtitle: 'Mien phi giao dich',
                          value: 'MOMO',
                        ),
                        if (_selectedPaymentMethod == 'Bank') ...[
                          const SizedBox(height: 16),
                          _buildBankTransferInfo(),
                        ] else if (_selectedPaymentMethod == 'MOMO') ...[
                          const SizedBox(height: 16),
                          _buildMomoInfo(),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildCouponSection(),
                  const SizedBox(height: 12),
                  _buildPointsSection(isLoggedIn),
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
                        if (_pointsDiscountValue > 0) ...[
                          const SizedBox(height: 8),
                          _buildSummaryRow(
                            'Tru ${_pointsFormatter.format(_effectivePointsToUse)} diem',
                            '-${_formatCurrency(_pointsDiscountValue)}',
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
                  onPressed: canSubmitOrder ? _placeOrder : null,
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
    final hasDiscount = item.originalPrice != null &&
        item.originalPrice! > item.unitPrice + 0.01;
    final discountValue = hasDiscount
        ? (item.originalPrice! - item.unitPrice) * item.quantity
        : 0.0;

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
              if (hasDiscount)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    'Giảm ${_formatCurrency(discountValue)}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.green[700],
                      fontWeight: FontWeight.w600,
                    ),
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
                  child: _buildGiftInfoTile(item),
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

  Widget _buildPointsSection(bool isLoggedIn) {
    final int availablePoints = _availablePoints;
    final int redeemableCap = _redeemableCap;
    final bool hasSummary = _pointsSummary != null;
    final bool canUsePoints = isLoggedIn && hasSummary && redeemableCap > 0;
    final double redeemedValue = _pointsDiscountValue;

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
                  Icons.stars_rounded,
                  color: kPrimaryBlue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Su dung diem thuong',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (!isLoggedIn)
            const Text(
              'Dang nhap de su dung diem tich luy.',
              style: TextStyle(fontSize: 14, color: Colors.black54),
            )
          else if (!hasSummary)
            Row(
              children: const [
                SizedBox(
                  height: 16,
                  width: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                SizedBox(width: 10),
                Text('Dang tai diem cua ban...'),
              ],
            )
            else ...[
              Text(
                'Diem kha dung: ${_pointsFormatter.format(availablePoints)} diem',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Co the khau tru toi da: ${_pointsFormatter.format(redeemableCap)} diem '
                '(${_formatCurrency(redeemableCap * kPointValueInVnd)}) tren don nay',
                style: TextStyle(fontSize: 13, color: Colors.grey[700]),
              ),
              const SizedBox(height: 4),
              Text(
                'Quy doi: 1 diem = ${_formatCurrency(kPointValueInVnd)}',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _pointsController,
              enabled: canUsePoints,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: InputDecoration(
                labelText: 'Nhap so diem muon su dung',
                suffixText: 'diem',
                hintText: canUsePoints
                    ? 'Vi du: 100'
                    : 'Khong the su dung diem cho don nay',
              ),
              onChanged: _handlePointInput,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: canUsePoints ? _applyMaxPoints : null,
                    child: const Text('Dung toi da'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextButton(
                    onPressed: _pointsToUse > 0 ? _clearPointsUsage : null,
                    child: const Text('Xoa diem'),
                  ),
                ),
              ],
            ),
            if (!canUsePoints && redeemableCap == 0)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Don hang hien chua du dieu kien hoac ban khong con diem kha dung.',
                  style: TextStyle(fontSize: 12, color: Colors.red[400]),
                ),
              ),
            if (redeemedValue > 0)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle,
                        size: 18, color: Colors.green),
                    const SizedBox(width: 8),
                    Text(
                      'Da tru ${_formatCurrency(redeemedValue)} tu '
                      '${_pointsFormatter.format(_effectivePointsToUse)} diem',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.green,
                      ),
                    ),
                  ],
                ),
              ),
          ],
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
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
              _recalculateShippingFee(address: result);
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
        ),
        if (_selectedAddress == null)
          const Padding(
            padding: EdgeInsets.only(top: 8, left: 4),
            child: Text(
              'Vui long chon dia chi de tiep tuc',
              style: TextStyle(
                color: Colors.redAccent,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
      ],
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
                  _recalculateShippingFee(address: result);
                }
              },
              style: TextButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w500,
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

  Widget _buildBankTransferInfo() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F7FF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kPrimaryBlue.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Thanh toan truc tuyen SePay',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Sau khi nhan "Dat hang", he thong se mo cong thanh toan SePay de ban thanh toan qua ngan hang hoac vi dien tu. Don hang se duoc cap nhat tu dong khi giao dich thanh cong.',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMomoInfo() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F7FF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kPrimaryBlue.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'Thanh toan qua MoMo',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
          SizedBox(height: 12),
          Text(
            'Sau khi nhan "Dat hang", he thong se hien ma QR/duong dan MoMo de ban thanh toan. Don hang se duoc cap nhat tu dong khi thanh toan thanh cong.',
            style: TextStyle(color: Colors.black54),
          ),
        ],
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
                (isTotal
                    ? const Color.fromARGB(255, 0, 0, 216)
                    : Colors.black87),
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

  Widget _buildGiftInfoTile(CheckoutProductSummary item) {
    final giftQty = item.giftQuantity ?? 0;
    final hasImage = item.giftImageUrl != null && item.giftImageUrl!.isNotEmpty;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFFFE082)),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
            ),
            child: hasImage
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      item.giftImageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.card_giftcard,
                        color: Colors.orange,
                      ),
                    ),
                  )
                : const Icon(Icons.card_giftcard, color: Colors.orange),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.giftName ?? 'Qua tang kem',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (item.giftVariantLabel != null &&
                    item.giftVariantLabel!.isNotEmpty)
                  Text(
                    item.giftVariantLabel!,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                Text(
                  giftQty > 0 ? 'So luong: x$giftQty' : 'Tang kem',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.orange,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
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
  final int? giftQuantity;
  final String? giftImageUrl;

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
    this.giftQuantity,
    this.giftImageUrl,
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
      giftQuantity:
          item.giftRewardQuantity > 0 ? item.giftRewardQuantity : null,
      giftImageUrl: item.giftProduct?.imageUrl,
    );
  }

  factory CheckoutProductSummary.fromBuyNow({
    Product? product,
    required ProductVariant variant,
    required int quantity,
    required double unitPrice,
    CartGiftOption? giftOption,
    int giftQuantity = 0,
  }) {
    final imageUrl = variant.images.isNotEmpty
        ? variant.images.first.url
        : product?.coverImage;
    String? giftVariantLabel;
    if (giftOption != null) {
      if (giftOption.label != null && giftOption.label!.isNotEmpty) {
        giftVariantLabel = giftOption.label;
      } else {
        final parts = <String>[];
        if (giftOption.sizeLabel != null && giftOption.sizeLabel!.isNotEmpty) {
          parts.add('Size ${giftOption.sizeLabel}');
        }
        if (giftOption.color != null && giftOption.color!.isNotEmpty) {
          parts.add(giftOption.color!);
        }
        giftVariantLabel = parts.isNotEmpty ? parts.join(' / ') : null;
      }
    }

    return CheckoutProductSummary(
      name: product?.name ?? 'San pham',
      variantLabel: variant.displayName,
      imageUrl: imageUrl,
      quantity: quantity,
      unitPrice: unitPrice,
      lineTotal: unitPrice * quantity,
      originalPrice: variant.price,
      giftName: giftOption?.name,
      giftVariantLabel: giftVariantLabel,
      giftQuantity: giftQuantity > 0 ? giftQuantity : null,
      giftImageUrl: giftOption?.imageUrl,
    );
  }
}
