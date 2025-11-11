import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/order_model.dart';
import '../services/order_service.dart';
import '../services/api_client.dart';
import '../services/trahang_service.dart';
import 'return_request_screen.dart';
import 'exchange_request_screen.dart';
import 'review_screen.dart';
import '../services/product_service.dart';

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
  late final ProductService _productService;
  Order? _order;
  bool _isLoading = false;
  List<_DisplayItem> _displayItems = [];

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

        // Debug log
        if (order != null) {
          debugPrint('✅ Order loaded: #${order.id}');
          debugPrint('   Status: ${order.orderStatus}');
          debugPrint('   Items count: ${order.items.length}');
          if (order.items.isEmpty) {
            debugPrint('⚠️ WARNING: Order has no items!');
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
      debugPrint('❌ Error loading order detail: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _enrichOrderItems(List<OrderItem> items) async {
    try {
      debugPrint('🔄 Enriching ${items.length} order items...');
      for (var i = 0; i < items.length; i++) {
        debugPrint(
            '  Item $i: variantId=${items[i].variantId}, qty=${items[i].quantity}');
      }

      // Build in parallel to keep UI snappy
      final futures = items.map((it) async {
        debugPrint('📥 Processing item with variantId: ${it.variantId}');
        ProductWithVariant? pv;
        try {
          pv = await _productService
              .getProductWithVariantByVariantId(it.variantId);
        } catch (e) {
          debugPrint('❌ Error fetching variant ${it.variantId}: $e');
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

        debugPrint('✅ Enriched item: $name (${it.variantId}) - $variantText');

        return _DisplayItem(
          name: name,
          variantText: variantText,
          imageUrl: img,
          price: it.price,
          quantity: it.quantity,
        );
      }).toList();

      final list = await Future.wait(futures);
      debugPrint('✅ All ${list.length} items enriched successfully');

      if (!mounted) return;
      setState(() {
        _displayItems = list;
      });
    } catch (e) {
      debugPrint('❌ Enrich items failed: $e');
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
              final item = hasEnriched
                  ? _displayItems[index]
                  : _DisplayItem(
                      name: _order!.items[index].productName ??
                          'Sản phẩm #${_order!.items[index].variantId}',
                      variantText: 'Mã SP: ${_order!.items[index].variantId}',
                      imageUrl: _buildImageUrl(null),
                      price: _order!.items[index].price,
                      quantity: _order!.items[index].quantity,
                    );

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product image
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
                          children: [
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
              );
            },
          ),
        ],
      ),
    );
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tổng tiền hàng:',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                ),
              ),
              Text(
                formatter.format(_order!.total),
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Phí vận chuyển:',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                ),
              ),
              Text(
                formatter.format(0),
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Tổng thanh toán:',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                formatter.format(_order!.total),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange,
                ),
              ),
            ],
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
    final canReview = _isReturnEligible();

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
      case 'ZaloPay':
        return Icons.payment;
      default:
        return Icons.credit_card;
    }
  }

  bool _shouldShowActions(String status) {
    // Show action area for all statuses except canceled. For 'Đã giao' we'll present return/review actions.
    return status != 'Đã hủy';
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
  const _DisplayItem({
    required this.name,
    required this.variantText,
    required this.imageUrl,
    required this.price,
    required this.quantity,
  });
  double get total => price * quantity;
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
