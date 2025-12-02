import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/coupon_model.dart';
import '../models/order_model.dart';
import '../models/review_model.dart';
import '../providers/auth_provider.dart';
import '../services/order_service.dart';
import '../services/api_client.dart';
import '../services/trahang_service.dart';
import '../services/review_service.dart';
import 'return_request_screen.dart';
import 'exchange_request_screen.dart';
import 'review_screen.dart';
import '../services/coupon_service.dart';
import '../services/product_service.dart';
import '../utils/order_gift_cache.dart';

class OrderDetailScreen extends StatefulWidget {
  final int orderId;

  const OrderDetailScreen({
    super.key,
    required this.orderId,
  });

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final OrderService _orderService = OrderService();
  final CouponService _couponService = CouponService();
  late final ProductService _productService;
  Order? _order;
  bool _isLoading = false;
  List<_DisplayItem> _displayItems = [];
  List<_VoucherDisplay> _voucherDisplays = [];
  double _itemsSubtotal = 0;
  double _productSavings = 0;
  double _shippingFee = 0;
  double _autoVoucherDiscount = 0;
  List<OrderGiftCacheEntry> _cachedGiftEntries = [];
  final ReviewService _reviewService = reviewService;
  Map<int, Review> _reviewsByOrderDetail = {};
  bool _loadingReviews = false;
  String? _reviewError;

  static const _supabaseProjectRef = 'ergnrfsqzghjseovmzkg';

  String _buildImageUrl(String? path) {
    if (path == null || path.isEmpty) {
      // Return empty string; callers use errorBuilder/fallback widget for missing images
      return '';
    }
    if (path.startsWith('http')) return path;
    return 'https://$_supabaseProjectRef.supabase.co/storage/v1/object/public/$path';
  }

  @override
  void initState() {
    super.initState();
    _productService = ProductService(ApiClient());
    _loadOrderDetail();
  }

  Future<void> _loadOrderDetail() async {
    setState(() => _isLoading = true);
    try {
      var order = await _orderService.getOrderById(widget.orderId);

      if (mounted) {
        setState(() {
          _order = order;
          _isLoading = false;
        });
        _updatePricingSummary();
        _loadVoucherDetails();
        _loadGiftCache();
        _loadReviewsForOrder();

        // Debug log
        if (order != null) {
          debugPrint(' Order loaded: #${order.id}');
          debugPrint('   Status: ${order.orderStatus}');
          debugPrint('   Items count: ${order.items.length}');
          if (order.items.isEmpty) {
            debugPrint(' WARNING: Order has no items!');
            debugPrint('   This might be because:');
            debugPrint('   1. Backend not restarted after code update');
            debugPrint('   2. Items were not saved when order was created');
            debugPrint('   3. API endpoint not returning items');
          } else {
            for (var item in order.items) {
              debugPrint(
                  '   - ${item.productName ?? "Product"} x${item.quantity}');
            }
            // Enrich items for pretty display
            _enrichOrderItems(order.items);
          }
        }
      }
    } catch (e) {
      debugPrint(' Error loading order detail: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lá»—i: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _loadVoucherDetails() async {
    final order = _order;
    if (order == null || order.appliedVoucherIds.isEmpty) {
      if (!mounted) return;
      setState(() {
        _voucherDisplays = [];
      });
      _updatePricingSummary();
      return;
    }

    try {
      final coupons = await _couponService.getCoupons(onlyActive: false);
      final byId = <int, Coupon>{};
      for (final coupon in coupons) {
        if (coupon.id != null) {
          byId[coupon.id!] = coupon;
        }
      }

      final subtotalAfterProductDiscounts = order.items.fold<double>(
          0, (sum, item) => sum + (item.price * item.quantity));
      const assumedShippingFee = 0.0;
      final displays = <_VoucherDisplay>[];
      double remainingSubtotal = subtotalAfterProductDiscounts;

      for (final vid in order.appliedVoucherIds) {
        final coupon = byId[vid];
        if (coupon == null) continue;
        final isShippingCoupon =
            coupon.discountType.toUpperCase() == 'FREESHIP';
        double discount;
        if (isShippingCoupon) {
          discount = coupon.calculateDiscount(
              remainingSubtotal, math.max(0, assumedShippingFee));
        } else {
          discount = coupon.calculateDiscount(remainingSubtotal, 0);
          remainingSubtotal = math.max(0, remainingSubtotal - discount);
        }
        if (discount <= 0) continue;
        displays.add(
          _VoucherDisplay(
            code:
                coupon.code.isNotEmpty ? coupon.code : 'Voucher #${coupon.id}',
            description: coupon.name ?? coupon.typeLabel,
            amount: discount,
            appliesToShipping: isShippingCoupon,
          ),
        );
      }

      if (!mounted) return;
      setState(() {
        _voucherDisplays = displays;
      });
      _updatePricingSummary();
    } catch (e) {
      debugPrint('Error loading voucher details: $e');
    }
  }

  void _updatePricingSummary() {
    final order = _order;
    if (!mounted || order == null) return;

    List<_DisplayItem> effectiveItems;
    if (_displayItems.isNotEmpty) {
      effectiveItems = _displayItems;
    } else {
      effectiveItems = order.items
          .map(
            (it) => _DisplayItem(
              name: it.productName ?? 'Sản phẩm #${it.variantId}',
              variantText:
                  it.variantName ?? 'Mã biến thể: ${it.variantId.toString()}',
              imageUrl: _buildImageUrl(null),
              price: it.price,
              quantity: it.quantity,
              variantId: it.variantId,
              gift: _giftFromCache(it.variantId),
            ),
          )
          .toList();
    }

    if (effectiveItems.isEmpty) return;

    double subtotal = 0;
    double productSavings = 0;
    for (final item in effectiveItems) {
      final basePrice = item.originalPrice ?? item.price;
      subtotal += basePrice * item.quantity;
      final diff = math.max(0, basePrice - item.price);
      productSavings += diff * item.quantity;
    }

    final subtotalAfterProduct = subtotal - productSavings;
    final merchVoucherSavings = _voucherDisplays
        .where((v) => !v.appliesToShipping)
        .fold<double>(0, (sum, v) => sum + math.max(0, v.amount));

    double shippingNet =
        order.total - (subtotalAfterProduct - merchVoucherSavings);
    double fallbackVoucher = 0;
    if (shippingNet < 0) {
      fallbackVoucher = -shippingNet;
      shippingNet = 0;
    }
    shippingNet = math.max(0, shippingNet);

    setState(() {
      _itemsSubtotal = subtotal;
      _productSavings = productSavings;
      _shippingFee = shippingNet;
      _autoVoucherDiscount = fallbackVoucher;
    });
  }

  _GiftInfo? _giftFromCache(int variantId) {
    if (_cachedGiftEntries.isEmpty) return null;
    OrderGiftCacheEntry? entry;
    for (final e in _cachedGiftEntries) {
      if (e.parentVariantId == variantId) {
        entry = e;
        break;
      }
    }
    if (entry == null) return null;
    return _GiftInfo(
      name: entry.giftName,
      variantText: entry.variantLabel,
      quantity: entry.quantity,
      imageUrl: _buildImageUrl(entry.imageUrl),
    );
  }

  Future<void> _enrichOrderItems(List<OrderItem> items) async {
    try {
      debugPrint(' Enriching ${items.length} order items...');
      for (var i = 0; i < items.length; i++) {
        debugPrint(
            '  Item $i: variantId=${items[i].variantId}, qty=${items[i].quantity}');
      }

      // Build in parallel to keep UI snappy
      final futures = items.map((it) async {
        debugPrint(' Processing item with variantId: ${it.variantId}');
        ProductWithVariant? pv;
        try {
          pv = await _productService
              .getProductWithVariantByVariantId(it.variantId);
        } catch (e) {
          debugPrint(' Error fetching variant ${it.variantId}: $e');
        }

        final name =
            pv?.product.name ?? it.productName ?? 'Sản phẩm #${it.variantId}';
        final variantText = () {
          final v = pv?.variant;
          final parts = <String>[];
          if (v?.color != null && v!.color!.isNotEmpty) parts.add(v.color!);
          if (v?.size != null && v!.size!.isNotEmpty) parts.add(v.size!);
          return parts.join(' - ');
        }();
        final img = (pv?.variant.images.isNotEmpty == true)
            ? _buildImageUrl(pv!.variant.images.first.url)
            : _buildImageUrl(null);

        debugPrint('Đã enrich item: $name (${it.variantId}) - $variantText');

        final basePrice = pv?.variant.price;
        _GiftInfo? giftInfo;
        if ((it.giftVariantId ?? 0) > 0 && it.giftQuantity > 0) {
          try {
            final gift = await _productService
                .getProductWithVariantByVariantId(it.giftVariantId!);
            if (gift != null) {
              final giftImage = (gift.variant.images.isNotEmpty)
                  ? _buildImageUrl(gift.variant.images.first.url)
                  : _buildImageUrl(gift.product.coverImage);
              giftInfo = _GiftInfo(
                name: gift.product.name,
                variantText: gift.variant.displayName.isNotEmpty
                    ? gift.variant.displayName
                    : null,
                quantity: it.giftQuantity,
                imageUrl: giftImage,
              );
            }
          } catch (giftErr) {
            debugPrint('Error loading gift product: $giftErr');
          }
        }

        return _DisplayItem(
          name: name,
          variantText: variantText,
          imageUrl: img,
          price: it.price,
          quantity: it.quantity,
          originalPrice: basePrice,
           gift: giftInfo,
           variantId: it.variantId,
        );
      }).toList();

      final list = await Future.wait(futures);
      debugPrint(' All ${list.length} items enriched successfully');

      if (!mounted) return;
      setState(() {
        _displayItems = list;
      });
      _applyGiftCacheToDisplayItems();
      _updatePricingSummary();
    } catch (e) {
      debugPrint('âŒ Enrich items failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: '₫',
      decimalDigits: 0,
    );

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Chi tiết đơn hàng #${widget.orderId}',
          style: const TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _order == null
              ? const Center(child: Text('Không tìm thấy đơn hàng'))
              : SingleChildScrollView(
                  child: Column(
                    children: [
                      // Trạng thái đơn hàng
                      _buildStatusSection(),
                      const SizedBox(height: 8),

                      // Thông tin đơn hàng
                      _buildOrderInfoSection(currencyFormatter),
                      const SizedBox(height: 8),

                      // Địa chỉ giao hàng
                      if (_order?.shippingAddress != null)
                        _buildShippingAddressSection(),
                      if (_order?.shippingAddress == null)
                        const SizedBox.shrink(),
                      const SizedBox(height: 8),

                      // Danh sách sản phẩm
                      _buildProductsSection(currencyFormatter),
                      const SizedBox(height: 8),

                      if (_isReviewEligible()) ...[
                        _buildReviewSection(),
                        const SizedBox(height: 8),
                      ],

                      // Thanh toán
                      _buildPaymentSection(currencyFormatter),
                      const SizedBox(height: 80), // Space for bottom button
                    ],
                  ),
                ),
      bottomSheet: _order != null && _shouldShowActions(_order!.orderStatus)
          ? Container(
              color: Colors.white,
              padding: const EdgeInsets.all(16),
              child: _buildActionButtons(),
            )
          : null,
    );
  }

  Widget _buildStatusSection() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Icon(
            _getStatusIcon(_order!.orderStatus),
            size: 60,
            color: _getStatusColor(_order!.orderStatus),
          ),
          const SizedBox(height: 12),
          Text(
            _order!.orderStatus,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: _getStatusColor(_order!.orderStatus),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _getStatusDescription(_order!.orderStatus),
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildOrderInfoSection(NumberFormat formatter) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Thông tin đơn hàng',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Divider(height: 24),
          _buildInfoRow(
            'Mã đơn hàng',
            '#${_order!.id}',
            Icons.receipt_outlined,
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            'Ngày đặt',
            DateFormat('dd/MM/yyyy HH:mm').format(_order!.orderDate),
            Icons.schedule,
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            'Phương thức thanh toán',
            _order!.paymentMethod,
            _getPaymentIcon(_order!.paymentMethod),
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            'Trạng thái thanh toán',
            _order!.paymentStatus,
            Icons.payment,
            valueColor: _order!.paymentStatus == 'Đã thanh toán'
                ? Colors.green
                : Colors.orange,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(
    String label,
    String value,
    IconData icon, {
    Color? valueColor,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: valueColor ?? Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildProductsSection(NumberFormat formatter) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Sản phẩm',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${_order!.items.length} sản phẩm',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const Divider(height: 24),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _displayItems.isNotEmpty
                ? _displayItems.length
                : _order!.items.length,
            separatorBuilder: (context, index) => const Divider(height: 24),
            itemBuilder: (context, index) {
              final hasEnriched = _displayItems.isNotEmpty;
              final orderItem = _order!.items[index];
              final item = hasEnriched
                  ? _displayItems[index]
                  : _DisplayItem(
                      name: orderItem.productName ??
                          'Sản phẩm #${orderItem.variantId}',
                      variantText:
                          orderItem.variantName ?? 'Mã SP: ${orderItem.variantId}',
                      imageUrl: _buildImageUrl(null),
                      price: orderItem.price,
                      quantity: orderItem.quantity,
                      variantId: orderItem.variantId,
                      gift: _giftFromCache(orderItem.variantId),
                    );
              final hasDiscount = item.originalPrice != null &&
                  item.originalPrice! > item.price + 0.01;
              final discountPercent = hasDiscount && item.originalPrice! > 0
                  ? ((item.originalPrice! - item.price) /
                          item.originalPrice! *
                          100)
                      .round()
                  : 0;
              final discountValue = hasDiscount
                  ? (item.originalPrice! - item.price) * item.quantity
                  : 0.0;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            item.imageUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(
                              color: Colors.grey[200],
                              child: const Icon(Icons.image, color: Colors.grey),
                            ),
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
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            if (item.variantText.isNotEmpty)
                              Text(
                                item.variantText,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            const SizedBox(height: 6),
                            Text(
                              'Số lượng: ${item.quantity}',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey[600],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (hasDiscount)
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        formatter.format(item.price),
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.orange,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Row(
                                        children: [
                                          Text(
                                            formatter.format(item.originalPrice),
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey[500],
                                              decoration: TextDecoration.lineThrough,
                                            ),
                                          ),
                                          if (discountPercent > 0)
                                            Container(
                                              margin: const EdgeInsets.only(left: 6),
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: Colors.orange[50],
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                              ),
                                              child: Text(
                                                '-$discountPercent%',
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  color: Colors.orange,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  )
                                else
                                  Text(
                                    formatter.format(item.price),
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.orange,
                                    ),
                                  ),
                                Text(
                                  'Tổng: ${formatter.format(item.total)}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (hasDiscount) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Đã giảm ${formatter.format(discountValue)}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.green,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                  if (item.gift != null) ...[
                    const SizedBox(height: 8),
                    _buildGiftTile(item.gift!),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Future<void> _loadGiftCache() async {
    final order = _order;
    if (order?.id == null) return;
    final entries = await OrderGiftCache.get(order!.id!);
    if (entries.isEmpty) return;
    if (!mounted) return;
    setState(() {
      _cachedGiftEntries = entries;
    });
    _applyGiftCacheToDisplayItems();
    await OrderGiftCache.remove(order.id!);
  }

  void _applyGiftCacheToDisplayItems() {
    if (_displayItems.isEmpty || _cachedGiftEntries.isEmpty) return;
    final map = <int, OrderGiftCacheEntry>{};
    for (final entry in _cachedGiftEntries) {
      map[entry.parentVariantId] = entry;
    }
    bool changed = false;
    final updated = <_DisplayItem>[];
    for (final item in _displayItems) {
      if (item.gift == null && item.variantId != null) {
        final entry = map[item.variantId];
        if (entry != null) {
          changed = true;
          updated.add(item.copyWith(
            gift: _GiftInfo(
              name: entry.giftName,
              variantText: entry.variantLabel,
              quantity: entry.quantity,
              imageUrl: _buildImageUrl(entry.imageUrl),
            ),
          ));
          continue;
        }
      }
      updated.add(item);
    }
    if (changed && mounted) {
      setState(() {
        _displayItems = updated;
      });
    }
  }

  Future<void> _loadReviewsForOrder() async {
    final order = _order;
    if (order == null || !_isReviewEligible()) {
      if (!mounted) return;
      setState(() {
        _reviewsByOrderDetail = {};
        _loadingReviews = false;
        _reviewError = null;
      });
      return;
    }
    final auth = Provider.of<AuthProvider?>(context, listen: false);
    if (auth == null || !auth.isAuthenticated || auth.user == null) {
      return;
    }
    setState(() {
      _loadingReviews = true;
      _reviewError = null;
    });
    final reviews = await _reviewService.getReviews(
      customerId: auth.user!.maKhachHang,
    );
    if (!mounted) return;
    if (reviews == null) {
      setState(() {
        _loadingReviews = false;
        _reviewsByOrderDetail = {};
        _reviewError = _reviewService.lastError;
      });
      return;
    }
    final map = <int, Review>{};
    for (final review in reviews) {
      final detailId = review.orderDetailId;
      if (detailId != null) {
        final hasItem = order.items.any((item) => item.id == detailId);
        if (hasItem) {
          map[detailId] = review;
          continue;
        }
      }
      if (review.orderId == order.id &&
          order.items.length == 1 &&
          order.items.first.id != null) {
        map[order.items.first.id!] = review;
      }
    }
    setState(() {
      _reviewsByOrderDetail = map;
      _loadingReviews = false;
      _reviewError = null;
    });
  }

  Widget _buildGiftTile(_GiftInfo gift) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFE082)),
      ),
      child: Row(
        children: [
          const Icon(Icons.card_giftcard, color: Color(0xFFFF9800)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  gift.name,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (gift.variantText != null && gift.variantText!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      gift.variantText!,
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    'Tặng kèm: x${gift.quantity}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.orange,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              gift.imageUrl,
              width: 48,
              height: 48,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                width: 48,
                height: 48,
                color: Colors.orange[100],
                child: const Icon(Icons.image_not_supported,
                    color: Colors.orange),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewSection() {
    final order = _order;
    if (order == null || order.items.isEmpty) {
      return const SizedBox.shrink();
    }
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.rate_review_outlined, color: Colors.orange),
              const SizedBox(width: 8),
              const Text(
                'Đánh giá sản phẩm',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              if (_loadingReviews)
                const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              else
                IconButton(
                  onPressed: _loadReviewsForOrder,
                  icon: const Icon(Icons.refresh, size: 18),
                  tooltip: 'Tải lại',
                ),
            ],
          ),
          if (_reviewError != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.error_outline, color: Colors.red[400]),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _reviewError!,
                    style: TextStyle(color: Colors.red[400]),
                  ),
                ),
                TextButton(
                  onPressed: _loadReviewsForOrder,
                  child: const Text('Thử lại'),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          ...order.items.map(_buildReviewProductTile),
        ],
      ),
    );
  }

  Widget _buildReviewProductTile(OrderItem item) {
    final review = item.id != null ? _reviewsByOrderDetail[item.id!] : null;
    final hasReview = review != null;
    final imageUrl = _buildImageUrl(item.imageUrl);
    final name = item.productName ?? 'Sản phẩm';
    final comment = review?.comment?.trim();
    final variantLabel =
        hasReview && review != null ? _formatVariantLabel(review) : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9FC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE0E7FF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: imageUrl.isNotEmpty
                    ? Image.network(
                        imageUrl,
                        width: 60,
                        height: 60,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 60,
                          height: 60,
                          color: Colors.grey[300],
                          child: const Icon(Icons.image_not_supported),
                        ),
                      )
                    : Container(
                        width: 60,
                        height: 60,
                        color: Colors.grey[300],
                        child: const Icon(Icons.image, color: Colors.white),
                      ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    hasReview
                        ? Row(
                            children: [
                              _buildStarRow(review!.rating, size: 16),
                              const SizedBox(width: 6),
                              Text(
                                '${review.rating}/5',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.orange,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          )
                        : Text(
                            'Chưa đánh giá',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                    if (hasReview && variantLabel != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          variantLabel,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                    if (hasReview && comment != null && comment.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          comment,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
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
          const SizedBox(height: 12),
          Row(
            children: [
              if (hasReview) ...[
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showReviewPreview(review!, item),
                    icon: const Icon(Icons.visibility_outlined, size: 18),
                    label: const Text('Xem đánh giá'),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () =>
                      _openReviewForItem(item, existingReview: review),
                  icon: Icon(hasReview ? Icons.edit : Icons.rate_review),
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        hasReview ? Colors.indigo : Colors.orange,
                    foregroundColor: Colors.white,
                  ),
                  label: Text(hasReview ? 'Chỉnh sửa' : 'Đánh giá'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStarRow(int rating, {double size = 18}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(
        5,
        (index) => Icon(
          index < rating ? Icons.star : Icons.star_border,
          color: Colors.amber,
          size: size,
        ),
      ),
    );
  }

  Future<void> _openReviewForItem(OrderItem item, {Review? existingReview}) async {
    if (_order == null) return;
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => ReviewScreen(
          order: _order!,
          item: item,
          existingReview: existingReview,
        ),
      ),
    );
    if (result == true) {
      _loadReviewsForOrder();
    }
  }

  void _showReviewPreview(Review review, OrderItem item) {
    final variantLabel = _formatVariantLabel(review);
    final dateText = review.reviewDate != null
        ? DateFormat('dd/MM/yyyy HH:mm').format(review.reviewDate!)
        : null;
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.reviews, color: Colors.orange),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    item.productName ?? 'Sản phẩm',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildStarRow(review.rating),
            if (variantLabel != null) ...[
              const SizedBox(height: 8),
              Text(
                variantLabel,
                style: TextStyle(color: Colors.grey[700]),
              ),
            ],
            if (dateText != null) ...[
              const SizedBox(height: 8),
              Text(
                'Đánh giá ngày $dateText',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            ],
            if (review.comment != null && review.comment!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                review.comment!,
                style: const TextStyle(fontSize: 14, height: 1.4),
              ),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _openReviewForItem(item, existingReview: review);
                },
                icon: const Icon(Icons.edit),
                label: const Text('Chỉnh sửa đánh giá'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String? _formatVariantLabel(Review review) {
    final parts = <String>[];
    if (review.variantColor != null &&
        review.variantColor!.trim().isNotEmpty) {
      parts.add('Màu: ${review.variantColor}');
    }
    if (review.variantSize != null && review.variantSize!.trim().isNotEmpty) {
      parts.add('Size: ${review.variantSize}');
    }
    if (parts.isEmpty) return null;
    return parts.join(' • ');
  }

  Widget _buildShippingAddressSection() {
    final a = _order!.shippingAddress!;
    String buildFull() {
      final parts = <String>[];
      if (a.diaChiCuThe != null && a.diaChiCuThe!.isNotEmpty)
        parts.add(a.diaChiCuThe!);
      if (a.phuong != null && a.phuong!.isNotEmpty) parts.add(a.phuong!);
      if (a.tinh != null && a.tinh!.isNotEmpty) parts.add(a.tinh!);
      if (parts.isNotEmpty) return parts.join(', ');
      return a.diaChi ?? '';
    }

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Địa chỉ giao hàng',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const Divider(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.location_on_outlined,
                  size: 20, color: Colors.grey[600]),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      a.ten ?? 'Người nhận',
                      style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                    if (a.soDienThoai?.isNotEmpty == true) ...[
                      const SizedBox(height: 4),
                      Text('SĐT: ${a.soDienThoai!}',
                          style:
                              TextStyle(fontSize: 13, color: Colors.grey[700])),
                    ],
                    const SizedBox(height: 4),
                    Text(buildFull(),
                        style:
                            TextStyle(fontSize: 14, color: Colors.grey[800])),
                  ],
                ),
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildPaymentSection(NumberFormat formatter) {
    final subtotal = _itemsSubtotal > 0 ? _itemsSubtotal : _order!.total;
    final productSavings = _productSavings;
    final total = _order!.total;

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Thanh toán',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Divider(height: 24),
          _buildPaymentRow(
            label: 'Tạm tính',
            value: subtotal,
            formatter: formatter,
          ),
          if (productSavings > 0)
            _buildPaymentRow(
              label: 'Khuyến mãi sản phẩm',
              value: productSavings,
              formatter: formatter,
              isDiscount: true,
            ),
          if (_voucherDisplays.isNotEmpty) ...[
            const SizedBox(height: 4),
            ..._voucherDisplays
                .map((v) => _buildVoucherRow(v, formatter))
                .toList(),
          ],
          if (_autoVoucherDiscount > 0)
            _buildPaymentRow(
              label: _voucherDisplays.isEmpty ? 'Mã giảm giá' : 'Khuyến mãi khác',
              value: _autoVoucherDiscount,
              formatter: formatter,
              isDiscount: true,
            ),
          const SizedBox(height: 8),
          _buildPaymentRow(
            label: 'Phí vận chuyển',
            value: _shippingFee > 0 ? _shippingFee : 0,
            formatter: formatter,
          ),
          const Divider(height: 24),
          _buildPaymentRow(
            label: 'Tổng thanh toán',
            value: total,
            formatter: formatter,
            emphasize: true,
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentRow({
    required String label,
    required double value,
    required NumberFormat formatter,
    bool isDiscount = false,
    bool emphasize = false,
  }) {
    final absValue = value.abs();
    final formatted = formatter.format(absValue);
    final displayValue = isDiscount ? '-$formatted' : formatted;
    final labelStyle = TextStyle(
      fontSize: emphasize ? 16 : 14,
      fontWeight: emphasize ? FontWeight.bold : FontWeight.w500,
      color: Colors.grey[700],
    );
    final valueStyle = TextStyle(
      fontSize: emphasize ? 20 : 14,
      fontWeight: emphasize ? FontWeight.bold : FontWeight.w600,
      color: emphasize
          ? Colors.orange
          : (isDiscount ? Colors.green[700] : Colors.black87),
    );

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: labelStyle),
          Text(displayValue, style: valueStyle),
        ],
      ),
    );
  }

  Widget _buildVoucherRow(
      _VoucherDisplay voucher, NumberFormat formatter) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Mã ${voucher.code}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (voucher.description != null &&
                    voucher.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      voucher.description!,
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ),
              ],
            ),
          ),
          Text(
            '-${formatter.format(voucher.amount)}',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.green,
            ),
          ),
        ],
      ),
    );
  }
  Widget _buildActionButtons() {
    final canCancel = _order!.orderStatus == 'Chờ xác nhận' ||
        _order!.orderStatus == 'Chờ lấy hàng';

    final canReturn = _isReturnEligible();
    final canExchange = _isExchangeEligible();
    final canReview = _isReviewEligible();

    return Row(
      children: [
        if (canCancel)
          Expanded(
            child: OutlinedButton(
              onPressed: _cancelOrder,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Hủy đơn'),
            ),
          ),
        if (canCancel) const SizedBox(width: 12),
        Expanded(
          child: OutlinedButton(
            onPressed: _contactShop,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.orange,
              side: const BorderSide(color: Colors.orange),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text('Liên hệ Shop'),
          ),
        ),
        if (_order!.orderStatus == 'Đang giao') const SizedBox(width: 12),
        if (_order!.orderStatus == 'Đang giao')
          Expanded(
            child: ElevatedButton(
              onPressed: _confirmReceived,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Đã nhận hàng'),
            ),
          ),

        // For delivered orders show return/review buttons when eligible
        if (canReturn) const SizedBox(width: 12),
        if (canReturn)
          Expanded(
            child: OutlinedButton(
              onPressed: _openNewReturn,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Trả hàng'),
            ),
          ),
        if (canExchange) const SizedBox(width: 12),
        if (canExchange)
          Expanded(
            child: OutlinedButton(
              onPressed: _openNewExchange,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.blue,
                side: const BorderSide(color: Colors.blue),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Đổi hàng'),
            ),
          ),
        if (canReview) const SizedBox(width: 12),
        if (canReview)
          Expanded(
            child: ElevatedButton(
              onPressed: _openReview,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Đánh giá'),
            ),
          ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Chờ xác nhận':
        return Colors.orange;
      case 'Chờ lấy hàng':
        return Colors.blue;
      case 'Đang giao':
        return Colors.purple;
      case 'Đã giao':
        return Colors.green;
      case 'Đã hủy':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'Chờ xác nhận':
        return Icons.hourglass_empty;
      case 'Chờ lấy hàng':
        return Icons.inventory_2_outlined;
      case 'Đang giao':
        return Icons.local_shipping_outlined;
      case 'Đã giao':
        return Icons.check_circle_outline;
      case 'Đã hủy':
        return Icons.cancel_outlined;
      default:
        return Icons.info_outline;
    }
  }

  String _getStatusDescription(String status) {
    switch (status) {
      case 'Chờ xác nhận':
        return 'Đơn hàng đang chờ người bán xác nhận';
      case 'Chờ lấy hàng':
        return 'Người bán đang chuẩn bị hàng';
      case 'Đang giao':
        return 'Đơn hàng đang được giao đến bạn';
      case 'Đã giao':
        return 'Đơn hàng đã được giao thành công';
      case 'Đã hủy':
        return 'Đơn hàng đã bị hủy';
      default:
        return '';
    }
  }

  IconData _getPaymentIcon(String method) {
    switch (method) {
      case 'COD':
        return Icons.money;
      case 'Bank':
        return Icons.account_balance;
      case 'Momo':
        return Icons.payment;
      default:
        return Icons.credit_card;
    }
  }

  bool _shouldShowActions(String status) {
    // Show action area for all statuses except canceled. For 'Đã giao' we'll present return/review actions.
    return status != 'Đã hủy';
  }
  bool _isReviewEligible() {
    if (_order == null) return false;
    final status = _order!.orderStatus.trim().toLowerCase();
    return status == 'da giao';
  }
  bool _isReturnEligible() {
    if (_order == null) return false;
    if (_order!.orderStatus.trim().toLowerCase() != 'đã giao') return false;
    // Check 7 days from DELIVERED DATE
    if (_order!.deliveredDate == null) return false;
    final diff = DateTime.now().difference(_order!.deliveredDate!).inDays;
    return diff >= 0 && diff <= 7;
  }

  bool _isExchangeEligible() => _isReturnEligible();

  Future<void> _cancelOrder() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hủy đơn hàng'),
        content: const Text('Bạn có chắc muốn hủy đơn hàng này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Không'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Hủy đơn',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      // Show loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      try {
        final success = await _orderService.cancelOrder(widget.orderId);

        if (mounted) {
          Navigator.pop(context); // Close loading dialog

          if (success) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Đã hủy đơn hàng thành công'),
                backgroundColor: Colors.green,
              ),
            );
            // Return to orders list and refresh, with status info
            Navigator.pop(context, {'refresh': true, 'newStatus': 'Đã hủy'});
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content:
                    Text(_orderService.lastError ?? 'Không thể hủy đơn hàng'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          Navigator.pop(context); // Close loading dialog
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Lỗi: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  void _contactShop() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Chức năng liên hệ shop đang phát triển')),
    );
  }

  Future<void> _confirmReceived() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận đã nhận hàng'),
        content: const Text('Bạn đã nhận được hàng và hài lòng với đơn hàng?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Chưa'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Đã nhận hàng'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      // Show loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      try {
        final success = await _orderService.updateOrderStatus(
          widget.orderId,
          orderStatus: 'Đã giao',
        );

        if (mounted) {
          Navigator.pop(context); // Close loading dialog

          if (success != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Cảm ơn bạn đã xác nhận!'),
                backgroundColor: Colors.green,
              ),
            );
            // Return to orders list and refresh, with status info
            Navigator.pop(context, {'refresh': true, 'newStatus': 'Đã giao'});
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                    _orderService.lastError ?? 'Không thể cập nhật đơn hàng'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          Navigator.pop(context); // Close loading dialog
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Lỗi: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  void _openReview() {
    // Navigate to review screen for all products in this order
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (c) => ReviewScreen(order: _order!),
      ),
    ).then((result) {
      if (result == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cảm ơn bạn đã đánh giá!'),
            backgroundColor: Colors.green,
          ),
        );
        _loadReviewsForOrder();
      }
    });
  }

  void _openNewReturn() {
    if (_order == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ReturnRequestScreen(order: _order!),
      ),
    ).then((ok) {
      if (ok == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã tạo yêu cầu trả hàng')),
        );
        _loadOrderDetail();
      }
    });
  }

  void _openNewExchange() {
    if (_order == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ExchangeRequestScreen(order: _order!),
      ),
    ).then((ok) {
      if (ok == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã tạo yêu cầu đổi hàng')),
        );
        _loadOrderDetail();
      }
    });
  }
}

class _DisplayItem {
  final String name;
  final String variantText;
  final String imageUrl;
  final double price;
  final int quantity;
  final double? originalPrice;
  final _GiftInfo? gift;
  final int? variantId;
  const _DisplayItem({
    required this.name,
    required this.variantText,
    required this.imageUrl,
    required this.price,
    required this.quantity,
    this.originalPrice,
    this.gift,
    this.variantId,
  });
  double get total => price * quantity;

  _DisplayItem copyWith({
    String? name,
    String? variantText,
    String? imageUrl,
    double? price,
    int? quantity,
    double? originalPrice,
    _GiftInfo? gift,
    int? variantId,
  }) {
    return _DisplayItem(
      name: name ?? this.name,
      variantText: variantText ?? this.variantText,
      imageUrl: imageUrl ?? this.imageUrl,
      price: price ?? this.price,
      quantity: quantity ?? this.quantity,
      originalPrice: originalPrice ?? this.originalPrice,
      gift: gift ?? this.gift,
      variantId: variantId ?? this.variantId,
    );
  }
}

class _GiftInfo {
  final String name;
  final String? variantText;
  final int quantity;
  final String imageUrl;

  const _GiftInfo({
    required this.name,
    this.variantText,
    required this.quantity,
    required this.imageUrl,
  });
}

class _VoucherDisplay {
  final String code;
  final String? description;
  final double amount;
  final bool appliesToShipping;

  const _VoucherDisplay({
    required this.code,
    this.description,
    required this.amount,
    this.appliesToShipping = false,
  });
}

class _ReturnForm extends StatefulWidget {
  final Order order;
  const _ReturnForm({Key? key, required this.order}) : super(key: key);

  @override
  State<_ReturnForm> createState() => _ReturnFormState();
}

class _ReturnFormState extends State<_ReturnForm> {
  int _selectedIndex = 0;
  int _quantity = 1;
  final _reasonCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.order.items;
    final selected = items.isNotEmpty ? items[_selectedIndex] : null;

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Yêu cầu trả hàng',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (items.isEmpty) const Text('Không có sản phẩm để trả.'),
          if (items.isNotEmpty) ...[
            DropdownButton<int>(
              value: _selectedIndex,
              items: List.generate(
                  items.length,
                  (i) => DropdownMenuItem(
                        value: i,
                        child: Text(items[i].productName ??
                            'Sản phẩm #${items[i].variantId}'),
                      )),
              onChanged: (v) => setState(() {
                _selectedIndex = v ?? 0;
                _quantity = 1;
              }),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Text('Số lượng:'),
                const SizedBox(width: 12),
                IconButton(
                    onPressed: _quantity > 1
                        ? () {
                            setState(() => _quantity--);
                          }
                        : null,
                    icon: const Icon(Icons.remove)),
                Text('$_quantity'),
                IconButton(
                    onPressed: selected != null && _quantity < selected.quantity
                        ? () {
                            setState(() => _quantity++);
                          }
                        : null,
                    icon: const Icon(Icons.add)),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _reasonCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Lý do trả hàng',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            height: 16,
                            width: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Text('Gửi yêu cầu'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (widget.order.items.isEmpty) return;
    final item = widget.order.items[_selectedIndex];
    final reason = _reasonCtrl.text.trim();
    if (reason.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Vui lòng nhập lý do')));
      return;
    }

    setState(() => _submitting = true);

    final payload = {
      'madonhang': widget.order.id,
      'makhachhang': widget.order.customerId,
      'machitietsanpham': item.variantId,
      'soluong': _quantity,
      'lydo': reason,
    };

    final res = await trahangService.createReturn(payload);
    setState(() => _submitting = false);
    if (res != null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã gửi yêu cầu trả hàng')));
      Navigator.pop(context);
      // optionally refresh order detail
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(trahangService.lastError ?? 'Lỗi khi gửi yêu cầu')));
    }
  }
}



