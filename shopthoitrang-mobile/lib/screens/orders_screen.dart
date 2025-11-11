import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/order_model.dart';
import '../models/review_model.dart';
import '../services/order_service.dart';
import '../services/trahang_service.dart';
import '../services/doihang_service.dart';
import '../services/review_service.dart';
import '../providers/auth_provider.dart';
import 'order_detail_screen.dart';
import 'review_screen.dart';
import 'exchange_request_screen.dart';
import 'return_request_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final OrderService _orderService = OrderService();
  final DoiHangService _doiHangService = DoiHangService();
  final ReviewService _reviewService = ReviewService();
  bool _isLoading = false;
  List<Order> _allOrders = [];
  Set<int> _returnedOrderIds =
      {}; // Lưu danh sách mã đơn đã gửi yêu cầu trả hàng
  Set<int> _exchangedOrderIds =
      {}; // Lưu danh sách mã đơn đã gửi yêu cầu đổi hàng
  Map<int, List<Review>> _reviewsByOrder = {};
  Set<int> _reviewedOrderIds = {};

  // Các trạng thái đơn hàng đồng bộ với web
  final List<String> _statuses = [
    'Chờ xác nhận',
    'Chờ lấy hàng',
    'Đang giao',
    'Đã giao',
    'Đã hủy',
    'Trả hàng',
    'Đổi hàng',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _statuses.length, vsync: this);
    _loadOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final auth = context.read<AuthProvider>();
      if (auth.isAuthenticated && auth.user != null) {
        debugPrint('?? Loading orders for customer: ${auth.user!.maKhachHang}');

        final orders =
            await _orderService.getOrdersByCustomer(auth.user!.maKhachHang);
        final reviewsByOrder =
            await _fetchReviewsByOrder(auth.user!.maKhachHang, orders);

        debugPrint('?? Received ${orders.length} orders');
        for (var order in orders) {
          debugPrint('  - Order #${order.id}: ${order.orderStatus}');
        }

        // Load danh s�ch don d� g?i y�u c?u tr? h�ng
        await _loadReturnedOrders();

        if (mounted) {
          setState(() {
            _allOrders = orders;
            _reviewsByOrder = reviewsByOrder;
            _reviewedOrderIds = reviewsByOrder.keys.toSet();
            _isLoading = false;
          });

          debugPrint('? State updated with ${_allOrders.length} orders');
        }
      } else {
        debugPrint('?? User not authenticated or null');
      }
    } catch (e) {
      debugPrint('?? Error loading orders: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<Map<int, List<Review>>> _fetchReviewsByOrder(
    int customerId,
    List<Order> orders,
  ) async {
    if (orders.isEmpty) return {};

    try {
      final reviews =
          await _reviewService.getReviews(customerId: customerId) ?? [];
      if (reviews.isEmpty) return {};

      final validOrderIds =
          orders.map((o) => o.id).whereType<int>().toSet();
      final Map<int, List<Review>> grouped = {};

      for (final review in reviews) {
        final orderId = review.orderId;
        if (orderId == null) continue;
        if (!validOrderIds.contains(orderId)) continue;

        grouped.putIfAbsent(orderId, () => []).add(review);
      }

      return grouped;
    } catch (e) {
      debugPrint('?? Error fetching reviews: $e');
      return {};
    }
  }

  /// Load danh sách mã đơn hàng đã gửi yêu cầu trả hàng
  Future<void> _loadReturnedOrders() async {
    try {
      final auth = context.read<AuthProvider>();
      if (auth.user == null) return;

      // Load trả hàng
      final returns = await trahangService.getMyReturns();
      if (returns != null) {
        final orderIds = <int>{};
        for (var item in returns) {
          if (item is Map && item['madonhang'] != null) {
            orderIds.add(item['madonhang'] as int);
          }
        }
        _returnedOrderIds = orderIds;
        debugPrint(
            '📦 Loaded ${_returnedOrderIds.length} returned orders: $_returnedOrderIds');
      }

      // Load đổi hàng
      final exchanges =
          await _doiHangService.getMyExchanges(auth.user!.maKhachHang);
      if (exchanges != null) {
        final orderIds = <int>{};
        for (var item in exchanges) {
          if (item is Map && item['madonhang'] != null) {
            orderIds.add(item['madonhang'] as int);
          }
        }
        _exchangedOrderIds = orderIds;
        debugPrint(
            '🔄 Loaded ${_exchangedOrderIds.length} exchanged orders: $_exchangedOrderIds');
      }
    } catch (e) {
      debugPrint('❌ Error loading returned/exchanged orders: $e');
    }
  }

  List<Order> _getOrdersByStatus(String status) {
    if (status == 'Trả hàng') {
      // Tab "Trả hàng" CHỈ hiển thị các đơn ĐÃ GỬI YÊU CẦU TRẢ HÀNG
      // Filter các đơn có id nằm trong _returnedOrderIds
      return _allOrders
          .where((order) => _returnedOrderIds.contains(order.id))
          .toList();
    }

    if (status == 'Đổi hàng') {
      // Tab "Đổi hàng" CHỈ hiển thị các đơn ĐÃ GỬI YÊU CẦU ĐỔI HÀNG
      // Filter các đơn có id nằm trong _exchangedOrderIds
      return _allOrders
          .where((order) => _exchangedOrderIds.contains(order.id))
          .toList();
    }

    return _allOrders.where((order) {
      final orderStatus = order.orderStatus.trim();
      final searchStatus = status.trim();

      // So sánh không phân biệt hoa thường
      final match = orderStatus.toLowerCase() == searchStatus.toLowerCase();

      return match;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text(
          'Đơn hàng',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: Colors.orange,
          unselectedLabelColor: Colors.grey[600],
          indicatorColor: Colors.orange,
          labelStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          tabs: _statuses.map((status) {
            final count = _getOrdersByStatus(status).length;
            return Tab(
              text: count > 0 ? '$status ($count)' : status,
            );
          }).toList(),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadOrders,
              child: TabBarView(
                controller: _tabController,
                children:
                    _statuses.map((status) => _buildOrderList(status)).toList(),
              ),
            ),
    );
  }

  Widget _buildOrderList(String status) {
    final orders = _getOrdersByStatus(status);

    debugPrint(
        '🔍 Tab "$status": ${orders.length} orders (Total: ${_allOrders.length})');

    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.receipt_long_outlined,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Chưa có đơn hàng',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
            if (_allOrders.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                'Tổng: ${_allOrders.length} đơn',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        return _buildOrderCard(orders[index]);
      },
    );
  }

  Widget _buildOrderCard(Order order) {
    final currencyFormatter = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: '₫',
      decimalDigits: 0,
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      child: InkWell(
        onTap: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => OrderDetailScreen(orderId: order.id!),
            ),
          );

          // Reload orders if status changed
          if (result != null && mounted) {
            if (result is Map && result['refresh'] == true) {
              await _loadOrders();

              // Auto switch to the new status tab if provided
              if (result['newStatus'] != null) {
                final newStatus = result['newStatus'] as String;
                final tabIndex = _statuses.indexWhere(
                  (s) => s.toLowerCase() == newStatus.toLowerCase(),
                );
                if (tabIndex >= 0) {
                  _tabController.animateTo(tabIndex);
                }
              }
            } else if (result == true) {
              // Backward compatibility
              await _loadOrders();
            }
          }
        },
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Mã đơn hàng và trạng thái
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.receipt_outlined,
                        size: 20,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Đơn hàng #${order.id}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color:
                          _getStatusColor(order.orderStatus).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      order.orderStatus,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _getStatusColor(order.orderStatus),
                      ),
                    ),
                  ),
                ],
              ),

              const Divider(height: 24),

              // Ngày đặt hàng
              Row(
                children: [
                  Icon(
                    Icons.schedule,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Ngày đặt: ${DateFormat('dd/MM/yyyy HH:mm').format(order.orderDate)}',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[700],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Phương thức thanh toán
              Row(
                children: [
                  Icon(
                    _getPaymentIcon(order.paymentMethod),
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Thanh toán: ${order.paymentMethod}',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[700],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Số lượng sản phẩm
              Row(
                children: [
                  Icon(
                    Icons.shopping_bag_outlined,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Số lượng: ${order.items.length} sản phẩm',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[700],
                    ),
                  ),
                ],
              ),

              const Divider(height: 24),

              // Tổng tiền
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Tổng tiền:',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[700],
                    ),
                  ),
                  Text(
                    currencyFormatter.format(order.total),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
                  ),
                ],
              ),

              // Action buttons dựa trên trạng thái
              if (_shouldShowActions(order.orderStatus)) ...[
                const SizedBox(height: 16),
                _buildActionButtons(order),
              ],
            ],
          ),
        ),
      ),
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
    // Hiển thị nút action cho các trạng thái: Chờ xác nhận, Chờ lấy hàng, Đang giao, Đã giao
    return status != 'Đã hủy';
  }

  Widget _buildActionButtons(Order order) {
    final canCancel = order.orderStatus == 'Chờ xác nhận' ||
        order.orderStatus == 'Chờ lấy hàng';

    // Determine return/review eligibility (within 7 days from DELIVERED DATE)
    bool isReturnEligible = false;
    if (order.orderStatus.trim().toLowerCase() == 'đã giao' &&
        order.deliveredDate != null) {
      final diff = DateTime.now().difference(order.deliveredDate!).inDays;
      isReturnEligible = diff >= 0 && diff <= 7;
    }
    // Đổi hàng dùng cùng điều kiện với trả (theo yêu cầu): trong 7 ngày sau ĐÃ GIAO
    final bool isExchangeEligible = isReturnEligible;

    return Row(
      children: [
        // Cancel button
        if (canCancel)
          Expanded(
            child: OutlinedButton(
              onPressed: () => _cancelOrder(order),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Hủy đơn'),
            ),
          ),

        if (canCancel) const SizedBox(width: 12),

        // If delivered and within 7 days -> show Trả hàng + Đánh giá
        if (isReturnEligible) ...[
          Expanded(
            child: OutlinedButton(
              onPressed: () => _openReturnFormForOrder(order),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Trả hàng'),
            ),
          ),
          const SizedBox(width: 12),
          if (isExchangeEligible)
            Expanded(
              child: OutlinedButton(
                onPressed: () => _openExchangeFormForOrder(order),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.blue,
                  side: const BorderSide(color: Colors.blue),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Đổi hàng'),
              ),
            ),
          if (isExchangeEligible) const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: () => _openReviewForOrder(order),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Đánh giá'),
            ),
          ),
        ] else ...[
          // Default: Liên hệ Shop + Mua lại
          Expanded(
            child: OutlinedButton(
              onPressed: () => _contactShop(order),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.orange,
                side: const BorderSide(color: Colors.orange),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Liên hệ Shop'),
            ),
          ),
          const SizedBox(width: 12),
          if (order.orderStatus == 'Đang giao')
            Expanded(
              child: ElevatedButton(
                onPressed: () => _confirmReceived(order),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Đã nhận hàng'),
              ),
            ),
          if (order.orderStatus == 'Đã giao')
            Expanded(
              child: ElevatedButton(
                onPressed: () => _reorder(order),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Mua lại'),
              ),
            ),
        ],
      ],
    );
  }

  // Helpers to open return/review from the order card
  void _openReturnFormForOrder(Order order) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (c) => ReturnRequestScreen(order: order),
      ),
    );
    if (result != null && mounted) await _loadOrders();
  }

  void _openReviewForOrder(Order order) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (c) => ReviewScreen(order: order)),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cảm ơn bạn đã đánh giá!'),
          backgroundColor: Colors.green,
        ),
      );
      await _loadOrders();
    }
  }

  void _openExchangeFormForOrder(Order order) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (c) => ExchangeRequestScreen(order: order),
      ),
    );
    if (result != null && mounted) await _loadOrders();
  }

  Future<void> _cancelOrder(Order order) async {
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
      // Loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final result = await _orderService.cancelOrder(order.id!);

      if (!mounted) return;
      Navigator.pop(context); // close loading

      if (result) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã hủy đơn hàng thành công'),
            backgroundColor: Colors.green,
          ),
        );
        await _loadOrders();
        // chuyển tab Đã hủy
        final idx = _statuses
            .indexWhere((s) => s.toLowerCase() == 'đã hủy'.toLowerCase());
        if (idx >= 0) _tabController.animateTo(idx);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                _orderService.lastError ?? 'Không thể hủy đơn hàng lúc này'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _contactShop(Order order) {
    // TODO: Implement contact shop (chat, phone, etc.)
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Chức năng liên hệ shop đang phát triển')),
    );
  }

  Future<void> _confirmReceived(Order order) async {
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
      // Loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final updated = await _orderService.updateOrderStatus(
        order.id!,
        orderStatus: 'Đã giao',
      );

      if (!mounted) return;
      Navigator.pop(context); // close loading

      if (updated != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cảm ơn bạn đã xác nhận!'),
            backgroundColor: Colors.green,
          ),
        );
        await _loadOrders();
        final idx = _statuses
            .indexWhere((s) => s.toLowerCase() == 'đã giao'.toLowerCase());
        if (idx >= 0) _tabController.animateTo(idx);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text(_orderService.lastError ?? 'Cập nhật trạng thái thất bại'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _reorder(Order order) {
    // TODO: Implement reorder functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Chức năng mua lại đang phát triển')),
    );
  }
}
