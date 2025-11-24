import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/chat_models.dart';
import '../models/order_model.dart';
import '../models/review_model.dart';
import '../services/order_service.dart';
import '../services/trahang_service.dart';
import '../services/doihang_service.dart';
import '../services/review_service.dart';
import '../providers/auth_provider.dart';
import '../services/cart_service.dart';
import '../services/chat_service.dart';
import '../utils/return_exchange_status.dart';
import 'cart_screen.dart';
import 'chat_screen.dart';
import 'exchange_detail_screen.dart';
import 'exchange_request_screen.dart';
import 'login_screen.dart';
import 'order_detail_screen.dart';
import 'return_request_screen.dart';
import 'review_screen.dart';

const Color kPrimaryBlue = Color(0xFF0288D1);
const Color kLightBlue = Color(0xFFE1F5FE);
const Color kDarkBlue = Color(0xFF01579B);

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
  final CartService _cartService = CartService();
  final ChatService _chatService = ChatService();
  bool _isLoading = false;
  List<Order> _allOrders = [];
  Set<int> _returnedOrderIds = {};
  Set<int> _exchangedOrderIds = {};
  Map<int, Map<String, dynamic>> _exchangesByOrder = {};
  Map<int, List<Review>> _reviewsByOrder = {};
  Set<int> _reviewedOrderIds = {};

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
        debugPrint('🔍 Loading orders for customer: ${auth.user!.maKhachHang}');

        final orders =
            await _orderService.getOrdersByCustomer(auth.user!.maKhachHang);
        final reviewsByOrder =
            await _fetchReviewsByOrder(auth.user!.maKhachHang, orders);

        debugPrint('📦 Received ${orders.length} orders');

        await _loadReturnedOrders();

        if (mounted) {
          setState(() {
            _allOrders = orders;
            _reviewsByOrder = reviewsByOrder;
            _reviewedOrderIds = reviewsByOrder.keys.toSet();
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      debugPrint('❌ Error loading orders: $e');
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

      final validOrderIds = orders.map((o) => o.id).whereType<int>().toSet();
      final Map<int, List<Review>> grouped = {};

      for (final review in reviews) {
        final orderId = review.orderId;
        if (orderId == null) continue;
        if (!validOrderIds.contains(orderId)) continue;

        grouped.putIfAbsent(orderId, () => []).add(review);
      }

      return grouped;
    } catch (e) {
      debugPrint('❌ Error fetching reviews: $e');
      return {};
    }
  }

  Future<void> _loadReturnedOrders() async {
    try {
      final auth = context.read<AuthProvider>();
      if (auth.user == null) return;

      final returns = await trahangService.getMyReturns();
      if (returns != null) {
        final orderIds = <int>{};
        for (var item in returns) {
          if (item is Map && item['madonhang'] != null) {
            orderIds.add(item['madonhang'] as int);
          }
        }
        _returnedOrderIds = orderIds;
      }

      _exchangesByOrder = {};
      final exchanges =
          await _doiHangService.getMyExchanges(auth.user!.maKhachHang);
      if (exchanges != null) {
        final orderIds = <int>{};
        for (var item in exchanges) {
          if (item is Map && item['madonhang'] != null) {
            final orderId = item['madonhang'] as int;
            orderIds.add(orderId);
            _exchangesByOrder[orderId] =
                item.map((key, value) => MapEntry(key.toString(), value));
          }
        }
        _exchangedOrderIds = orderIds;
      }
    } catch (e) {
      debugPrint('❌ Error loading returned/exchanged orders: $e');
    }
  }

  List<Order> _getOrdersByStatus(String status) {
    if (status == 'Trả hàng') {
      return _allOrders
          .where((order) => _returnedOrderIds.contains(order.id))
          .toList();
    }

    if (status == 'Đổi hàng') {
      return _allOrders
          .where((order) => _exchangedOrderIds.contains(order.id))
          .toList();
    }

    return _allOrders.where((order) {
      final orderStatus = order.orderStatus.trim();
      final searchStatus = status.trim();
      return orderStatus.toLowerCase() == searchStatus.toLowerCase();
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        backgroundColor: kPrimaryBlue,
        elevation: 0,
        title: const Text(
          'Đơn hàng của tôi',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: kPrimaryBlue,
              unselectedLabelColor: Colors.grey[600],
              indicatorColor: kPrimaryBlue,
              indicatorWeight: 3,
              labelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
              tabs: _statuses.map((status) {
                final count = _getOrdersByStatus(status).length;
                return Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(status),
                      if (count > 0) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: kPrimaryBlue,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '$count',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              color: kPrimaryBlue,
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

    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: kLightBlue.withOpacity(0.3),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.receipt_long_outlined,
                size: 64,
                color: kPrimaryBlue.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Chưa có đơn hàng',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Đơn hàng của bạn sẽ hiển thị ở đây',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
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

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () async {
            final result = await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => OrderDetailScreen(orderId: order.id!),
              ),
            );

            if (result != null && mounted) {
              if (result is Map && result['refresh'] == true) {
                await _loadOrders();

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
                await _loadOrders();
              }
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: kLightBlue,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.receipt_long,
                        size: 20,
                        color: kPrimaryBlue,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Đơn hàng #${order.id}',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: kDarkBlue,
                            ),
                          ),
                          Text(
                            DateFormat('dd/MM/yyyy HH:mm')
                                .format(order.orderDate),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color:
                            _getStatusColor(order.orderStatus).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _getStatusColor(order.orderStatus)
                              .withOpacity(0.3),
                        ),
                      ),
                      child: Text(
                        order.orderStatus,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: _getStatusColor(order.orderStatus),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),
                Container(
                  height: 1,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.grey[200]!,
                        Colors.grey[100]!,
                        Colors.grey[200]!,
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Order info
                _buildInfoRow(
                  icon: Icons.payment,
                  label: 'Thanh toán',
                  value: order.paymentMethod,
                  iconColor: kPrimaryBlue,
                ),
                const SizedBox(height: 10),
                _buildInfoRow(
                  icon: Icons.shopping_bag_outlined,
                  label: 'Số lượng',
                  value: '${_getTotalQuantity(order)} sản phẩm',
                  iconColor: Colors.orange,
                ),

                const SizedBox(height: 16),

                // Total
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        kPrimaryBlue.withOpacity(0.05),
                        kLightBlue.withOpacity(0.3),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.account_balance_wallet,
                            size: 18,
                            color: kPrimaryBlue,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Tổng tiền:',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[700],
                            ),
                          ),
                        ],
                      ),
                      Text(
                        currencyFormatter.format(order.total),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: kPrimaryBlue,
                        ),
                      ),
                    ],
                  ),
                ),

                if (_exchangesByOrder.containsKey(order.id)) ...[
                  const SizedBox(height: 12),
                  _buildExchangeSummary(order),
                ],

                // Action buttons
                if (_shouldShowActions(order.orderStatus)) ...[
                  const SizedBox(height: 16),
                  _buildActionButtons(order),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    required Color iconColor,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(
            icon,
            size: 16,
            color: iconColor,
          ),
        ),
        const SizedBox(width: 10),
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[600],
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  // Thay thế method _buildExchangeSummary trong OrdersScreen

  Widget _buildExchangeSummary(Order order) {
    final exchange = _exchangesByOrder[order.id];
    if (exchange == null) return const SizedBox.shrink();

    final dynamic rawId =
        exchange['maDoiHang'] ?? exchange['madoihang'] ?? exchange['id'];
    final int? exchangeId =
        rawId is int ? rawId : int.tryParse(rawId?.toString() ?? '');
    final statusCode = (exchange['trangthai'] ?? exchange['trangThai'] ?? '')
        .toString()
        .trim();
    final statusLabel =
        ExchangeStatusMapper.labels[statusCode] ?? statusCode ?? '---';
    final statusColor = ExchangeStatusMapper.color(statusCode);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            kPrimaryBlue.withOpacity(0.05),
            kLightBlue.withOpacity(0.15),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: kPrimaryBlue.withOpacity(0.2),
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: kPrimaryBlue.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.sync_alt,
                  color: kPrimaryBlue,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Phiếu đổi hàng',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '#$exchangeId',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: kDarkBlue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: statusColor.withOpacity(0.3),
                        ),
                      ),
                      child: Text(
                        statusLabel,
                        style: TextStyle(
                          fontSize: 12,
                          color: statusColor,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: exchangeId == null
                  ? null
                  : () => _openExchangeDetail(exchangeId),
              icon: const Icon(Icons.visibility_outlined, size: 18),
              label: const Text(
                'Xem chi tiết đổi hàng',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: kPrimaryBlue,
                foregroundColor: Colors.white,
                elevation: 2,
                shadowColor: kPrimaryBlue.withOpacity(0.3),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Chờ xác nhận':
        return Colors.orange;
      case 'Chờ lấy hàng':
        return kPrimaryBlue;
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
    return status != 'Đã hủy';
  }

  Widget _buildActionButtons(Order order) {
    final canCancel = order.orderStatus == 'Chờ xác nhận' ||
        order.orderStatus == 'Chờ lấy hàng';

    bool isReturnEligible = false;
    if (order.orderStatus.trim().toLowerCase() == 'đã giao' &&
        order.deliveredDate != null) {
      final diff = DateTime.now().difference(order.deliveredDate!).inDays;
      isReturnEligible = diff >= 0 && diff <= 7;
    }

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        if (canCancel)
          _buildActionButton(
            label: 'Hủy đơn',
            icon: Icons.cancel_outlined,
            color: Colors.red,
            onPressed: () => _cancelOrder(order),
            isOutlined: true,
          ),
        if (isReturnEligible) ...[
          _buildActionButton(
            label: 'Trả hàng',
            icon: Icons.keyboard_return,
            color: Colors.red,
            onPressed: () => _openReturnFormForOrder(order),
            isOutlined: true,
          ),
          _buildActionButton(
            label: 'Đổi hàng',
            icon: Icons.swap_horiz,
            color: kPrimaryBlue,
            onPressed: () => _openExchangeFormForOrder(order),
            isOutlined: true,
          ),
          _buildActionButton(
            label: 'Đánh giá',
            icon: Icons.star_outline,
            color: Colors.orange,
            onPressed: () => _openReviewForOrder(order),
          ),
        ] else ...[
          _buildActionButton(
            label: 'Liên hệ Shop',
            icon: Icons.chat_bubble_outline,
            color: kPrimaryBlue,
            onPressed: () => _contactShop(order),
            isOutlined: true,
          ),
          if (order.orderStatus == 'Đang giao')
            _buildActionButton(
              label: 'Đã nhận hàng',
              icon: Icons.check_circle_outline,
              color: Colors.green,
              onPressed: () => _confirmReceived(order),
            ),
          if (order.orderStatus == 'Đã giao')
            _buildActionButton(
              label: 'Mua lại',
              icon: Icons.shopping_cart_outlined,
              color: kPrimaryBlue,
              onPressed: () => _reorder(order),
            ),
        ],
      ],
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
    bool isOutlined = false,
  }) {
    return isOutlined
        ? OutlinedButton.icon(
            onPressed: onPressed,
            icon: Icon(icon, size: 16),
            label: Text(label),
            style: OutlinedButton.styleFrom(
              foregroundColor: color,
              side: BorderSide(color: color),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 8,
              ),
            ),
          )
        : ElevatedButton.icon(
            onPressed: onPressed,
            icon: Icon(icon, size: 16),
            label: Text(label),
            style: ElevatedButton.styleFrom(
              backgroundColor: color,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 8,
              ),
            ),
          );
  }

  void _openExchangeDetail(int maDoiHang) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ExchangeDetailScreen(maDoiHang: maDoiHang),
      ),
    );
  }

  void _openReturnFormForOrder(Order order) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (c) => ReturnRequestScreen(order: order),
      ),
    );
    if (result == true && mounted) {
      await _loadOrders();
      final idx = _statuses.indexWhere(
        (s) => s.toLowerCase() == 'trả hàng'.toLowerCase(),
      );
      if (idx >= 0) {
        _tabController.animateTo(idx);
      }
    }
  }

  void _openReviewForOrder(Order order) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (c) => ReviewScreen(order: order)),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: const [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 12),
              Text('Cảm ơn bạn đã đánh giá!'),
            ],
          ),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
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
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Text('Hủy đơn hàng'),
        content: const Text('Bạn có chắc muốn hủy đơn hàng này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Không', style: TextStyle(color: Colors.grey[600])),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Hủy đơn'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final result = await _orderService.cancelOrder(order.id!);

      if (!mounted) return;
      Navigator.pop(context);

      if (result) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: const [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 12),
                Text('Đã hủy đơn hàng thành công'),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
        await _loadOrders();
        final idx = _statuses
            .indexWhere((s) => s.toLowerCase() == 'đã hủy'.toLowerCase());
        if (idx >= 0) _tabController.animateTo(idx);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                _orderService.lastError ?? 'Không thể hủy đơn hàng lúc này'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    }
  }

  Future<void> _contactShop(Order order) async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.user == null) {
      final goLogin = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text('Cần đăng nhập'),
          content: const Text(
              'Vui lòng đăng nhập để trao đổi với nhân viên hỗ trợ.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Để sau'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: kPrimaryBlue,
              ),
              child: const Text('Đăng nhập'),
            ),
          ],
        ),
      );
      if (goLogin == true && mounted) {
        await Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
      return;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    ChatBox? chatBox;
    try {
      chatBox = await _chatService.startChat();
      final summary = _buildOrderSummaryMessage(order);
      if (summary.isNotEmpty) {
        await _chatService.sendMessage(chatBox.id, summary);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể mở chat: $e')),
        );
      }
    } finally {
      if (mounted) Navigator.of(context, rootNavigator: true).pop();
    }

    if (!mounted || chatBox == null) return;

    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ChatScreen(chatBox: chatBox!),
      ),
    );
  }

  String _buildOrderSummaryMessage(Order order) {
    final buffer = StringBuffer();
    final currency = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
    final orderId = order.id != null ? '#${order.id}' : 'không rõ';
    buffer.writeln('Khách cần hỗ trợ về đơn $orderId');
    buffer.writeln('Trạng thái: ${order.orderStatus}');
    buffer
        .writeln('Thanh toán: ${order.paymentMethod} - ${order.paymentStatus}');
    buffer.writeln('Tổng tiền: ${currency.format(order.total)}');
    buffer.writeln(
        'Ngày đặt: ${DateFormat('dd/MM/yyyy HH:mm').format(order.orderDate)}');

    if (order.items.isNotEmpty) {
      buffer.writeln('Sản phẩm:');
      final preview = order.items.take(3).toList();
      for (final item in preview) {
        final name = item.productName ?? 'Sản phẩm';
        buffer.writeln('- $name x${item.quantity}');
      }
      if (order.items.length > preview.length) {
        buffer.writeln(
            '... (${order.items.length - preview.length} sản phẩm khác)');
      }
    }

    return buffer.toString().trim();
  }

  int _getTotalQuantity(Order order) {
    if (order.items.isEmpty) return 0;
    return order.items.fold<int>(0, (sum, item) => sum + item.quantity);
  }

  Future<void> _confirmReceived(Order order) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Text('Xác nhận đã nhận hàng'),
        content: const Text('Bạn đã nhận được hàng và hài lòng với đơn hàng?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Chưa', style: TextStyle(color: Colors.grey[600])),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Đã nhận hàng'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
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
      Navigator.pop(context);

      if (updated != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: const [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 12),
                Text('Cảm ơn bạn đã xác nhận!'),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
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
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    }
  }

  Future<void> _reorder(Order order) async {
    if (order.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Đơn hàng không có sản phẩm để mua lại'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
      return;
    }

    final items = order.items.where((item) => item.variantId > 0).toList();
    if (items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Không thể xác định sản phẩm để mua lại'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
      return;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    int added = 0;
    int failed = 0;
    for (final item in items) {
      final ok = await _cartService.addToCart(
        variantId: item.variantId,
        price: item.price,
        quantity: item.quantity > 0 ? item.quantity : 1,
        sizeBridgeId: item.sizeBridgeId,
      );
      if (ok) {
        added += 1;
      } else {
        failed += 1;
      }
    }

    if (!mounted) return;
    Navigator.of(context, rootNavigator: true).pop();

    if (added > 0) {
      final message = failed == 0
          ? 'Đã thêm $added sản phẩm vào giỏ hàng'
          : 'Đã thêm $added sản phẩm, $failed sản phẩm không thể thêm';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text(message)),
            ],
          ),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          action: SnackBarAction(
            label: 'Xem giỏ hàng',
            textColor: Colors.white,
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const CartScreen()),
              );
            },
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              const Text('Không thể thêm sản phẩm vào giỏ, vui lòng thử lại'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
    }
  }
}
