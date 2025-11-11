import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/notification_service.dart';
import '../services/api_client.dart';
import '../models/notification_model.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late NotificationService _notificationService;

  List<PromotionNotification> _promos = [];
  List<OrderNotification> _orderUpdates = [];
  bool _loadingPromos = true;
  bool _loadingOrders = true;
  String? _errorPromos;
  String? _errorOrders;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _notificationService = NotificationService(ApiClient());
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    await Future.wait([_loadPromos(), _loadOrderUpdates()]);
  }

  String _formatDiscountInfo(PromotionNotification promo) {
    if (promo.discountPercent != null) {
      return 'Giảm ${promo.discountPercent!.toStringAsFixed(0)}%';
    } else if (promo.discountAmount != null) {
      return 'Giảm ${_formatMoney(promo.discountAmount!)}';
    }
    return '';
  }

  String _formatMoney(double amount) {
    if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(0)}M';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(0)}K';
    }
    return amount.toStringAsFixed(0);
  }

  Future<void> _loadPromos() async {
    try {
      setState(() {
        _loadingPromos = true;
        _errorPromos = null;
      });

      // Lấy thông báo khuyến mãi từ server
      final promos = await _notificationService.getPromotions();

      if (mounted) {
        setState(() {
          _promos = promos;
          _loadingPromos = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorPromos = e.toString();
          _loadingPromos = false;
        });
      }
      debugPrint('Error loading promos: $e');
    }
  }

  Future<void> _loadOrderUpdates() async {
    try {
      setState(() {
        _loadingOrders = true;
        _errorOrders = null;
      });

      final auth = context.read<AuthProvider>();
      if (!auth.isAuthenticated) {
        if (mounted) {
          setState(() => _loadingOrders = false);
        }
        return;
      }

      // Lấy cập nhật đơn hàng từ server
      final orders = await _notificationService.getOrderUpdates();

      if (mounted) {
        setState(() {
          _orderUpdates = orders;
          _loadingOrders = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorOrders = e.toString();
          _loadingOrders = false;
        });
      }
      debugPrint('Error loading order updates: $e');
    }
  }

  void _showPromotionDetail(BuildContext context, PromotionNotification promo) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(promo.title),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              promo.message,
              style: const TextStyle(fontSize: 15),
            ),
            const SizedBox(height: 16),
            if (promo.voucherCode != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.local_offer, color: Colors.green.shade700),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Mã khuyến mãi:',
                          style: TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                        Text(
                          promo.voucherCode!,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.green.shade700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
            if (promo.discountPercent != null ||
                promo.discountAmount != null) ...[
              _buildDetailRow(
                'Giảm giá:',
                _formatDiscountInfo(promo),
              ),
              const SizedBox(height: 8),
            ],
            if (promo.validFrom != null) ...[
              _buildDetailRow(
                'Từ ngày:',
                '${promo.validFrom!.day}/${promo.validFrom!.month}/${promo.validFrom!.year}',
              ),
              const SizedBox(height: 8),
            ],
            if (promo.validUntil != null) ...[
              _buildDetailRow(
                'Đến ngày:',
                '${promo.validUntil!.day}/${promo.validUntil!.month}/${promo.validUntil!.year}',
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Đóng'),
          ),
          if (promo.voucherCode != null)
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                // Copy voucher code or navigate to use it
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Mã ${promo.voucherCode} đã được sao chép!'),
                    duration: const Duration(seconds: 2),
                  ),
                );
              },
              child: const Text('Sao chép mã'),
            ),
        ],
      ),
    );
  }

  void _showOrderDetail(BuildContext context, OrderNotification order) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Đơn hàng ${order.orderCode}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('Mã đơn hàng:', order.orderCode),
            const SizedBox(height: 8),
            _buildDetailRow('Trạng thái:', order.status),
            const SizedBox(height: 8),
            _buildDetailRow(
              'Tổng tiền:',
              '${order.totalAmount.toStringAsFixed(0).replaceAllMapped(
                    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                    (Match m) => '${m[1]}.',
                  )}₫',
            ),
            const SizedBox(height: 8),
            _buildDetailRow(
              'Ngày đặt:',
              '${order.orderDate.day}/${order.orderDate.month}/${order.orderDate.year}',
            ),
            if (order.message != null && order.message!.isNotEmpty) ...[
              const SizedBox(height: 8),
              _buildDetailRow('Ghi chú:', order.message!),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              // Navigate to order details page if you have one
              // Navigator.pushNamed(context, '/order-detail', arguments: order.orderId);
            },
            child: const Text('Xem chi tiết'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(color: Colors.black54),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Khuyến mãi'),
            Tab(text: 'Đơn hàng'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPromosTab(),
          _buildOrdersTab(),
        ],
      ),
    );
  }

  Widget _buildPromosTab() {
    if (_loadingPromos) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorPromos != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 80, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Lỗi khi tải khuyến mãi',
              style: TextStyle(color: Colors.grey[600], fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              _errorPromos!,
              style: TextStyle(color: Colors.grey[500], fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadPromos,
              child: const Text('Thử lại'),
            ),
          ],
        ),
      );
    }

    if (_promos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications_none, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Chưa có thông báo khuyến mãi',
              style: TextStyle(color: Colors.grey[600], fontSize: 16),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadPromos,
      child: ListView.separated(
        padding: const EdgeInsets.all(8),
        itemCount: _promos.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final item = _promos[index];
          return _NotificationCard(
            title: item.title,
            message: item.message,
            voucherCode: item.voucherCode,
            discountInfo: _formatDiscountInfo(item),
            timestamp: item.createdAt,
            isRead: item.isRead,
            onTap: () {
              // Mark as read
              setState(() {
                _promos[index] = item.copyWith(isRead: true);
              });
              _notificationService.markAsRead(item.id.toString(), 'promo');
              // Show promotion detail
              _showPromotionDetail(context, item);
            },
          );
        },
      ),
    );
  }

  Widget _buildOrdersTab() {
    final auth = context.watch<AuthProvider>();
    if (!auth.isAuthenticated) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.account_circle_outlined,
                size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Vui lòng đăng nhập để xem cập nhật đơn hàng',
              style: TextStyle(color: Colors.grey[600], fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pushReplacementNamed('/login');
              },
              child: const Text('Đăng nhập'),
            ),
          ],
        ),
      );
    }

    if (_loadingOrders) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorOrders != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 80, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Lỗi khi tải đơn hàng',
              style: TextStyle(color: Colors.grey[600], fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              _errorOrders!,
              style: TextStyle(color: Colors.grey[500], fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadOrderUpdates,
              child: const Text('Thử lại'),
            ),
          ],
        ),
      );
    }

    if (_orderUpdates.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shopping_bag_outlined,
                size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Chưa có cập nhật đơn hàng',
              style: TextStyle(color: Colors.grey[600], fontSize: 16),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadOrderUpdates,
      child: ListView.separated(
        padding: const EdgeInsets.all(8),
        itemCount: _orderUpdates.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final update = _orderUpdates[index];
          return _OrderUpdateCard(
            orderId: update.orderCode,
            status: update.status,
            message: update.message ?? '',
            totalAmount: update.totalAmount,
            timestamp: update.statusUpdatedAt ?? update.orderDate,
            isRead: update.isRead,
            onTap: () {
              // Mark as read
              setState(() {
                _orderUpdates[index] = update.copyWith(isRead: true);
              });
              _notificationService.markAsRead(
                  update.orderId.toString(), 'order');
              // Show order details dialog or navigate
              _showOrderDetail(context, update);
            },
          );
        },
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final String title;
  final String message;
  final String? voucherCode;
  final String? discountInfo;
  final DateTime timestamp;
  final bool isRead;
  final VoidCallback? onTap;

  const _NotificationCard({
    required this.title,
    required this.message,
    this.voucherCode,
    this.discountInfo,
    required this.timestamp,
    required this.isRead,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        color: isRead ? Colors.white : Colors.blue.shade50,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.orange.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.local_offer,
                color: Colors.orange.shade700,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: TextStyle(
                            fontWeight:
                                isRead ? FontWeight.w500 : FontWeight.w700,
                            fontSize: 15,
                          ),
                        ),
                      ),
                      if (!isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Colors.blue,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: TextStyle(
                      color: Colors.grey[700],
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  if (voucherCode != null || discountInfo != null)
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        if (voucherCode != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.green.shade100,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'Mã: $voucherCode',
                              style: TextStyle(
                                color: Colors.green.shade700,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        if (discountInfo != null && discountInfo!.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.red.shade100,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              discountInfo!,
                              style: TextStyle(
                                color: Colors.red.shade700,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTimestamp(timestamp),
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 60) {
      return '${diff.inMinutes} phút trước';
    } else if (diff.inHours < 24) {
      return '${diff.inHours} giờ trước';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} ngày trước';
    } else {
      return '${dt.day}/${dt.month}/${dt.year}';
    }
  }
}

class _OrderUpdateCard extends StatelessWidget {
  final String orderId;
  final String status;
  final String message;
  final double totalAmount;
  final DateTime timestamp;
  final bool isRead;
  final VoidCallback? onTap;

  const _OrderUpdateCard({
    required this.orderId,
    required this.status,
    required this.message,
    required this.totalAmount,
    required this.timestamp,
    required this.isRead,
    this.onTap,
  });

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Đã giao':
        return Colors.green;
      case 'Đang giao':
        return Colors.blue;
      case 'Đang xử lý':
        return Colors.orange;
      case 'Đã hủy':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'Đã giao':
        return Icons.check_circle;
      case 'Đang giao':
        return Icons.local_shipping;
      case 'Đang xử lý':
        return Icons.pending;
      case 'Đã hủy':
        return Icons.cancel;
      default:
        return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(status);

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        color: isRead ? Colors.white : Colors.blue.shade50,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getStatusIcon(status),
                color: statusColor,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Đơn hàng $orderId',
                        style: TextStyle(
                          fontWeight:
                              isRead ? FontWeight.w500 : FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          status,
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const Spacer(),
                      if (!isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Colors.blue,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: TextStyle(
                      color: Colors.grey[700],
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade100,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Tổng tiền: ${_formatCurrency(totalAmount)}',
                      style: TextStyle(
                        color: Colors.blue.shade700,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTimestamp(timestamp),
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatCurrency(double amount) {
    return '${amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        )}₫';
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 60) {
      return '${diff.inMinutes} phút trước';
    } else if (diff.inHours < 24) {
      return '${diff.inHours} giờ trước';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} ngày trước';
    } else {
      return '${dt.day}/${dt.month}/${dt.year}';
    }
  }
}

// Models
class NotificationItem {
  final String id;
  final String title;
  final String message;
  final DateTime timestamp;
  final bool isRead;

  NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.isRead,
  });

  NotificationItem copyWith({
    String? id,
    String? title,
    String? message,
    DateTime? timestamp,
    bool? isRead,
  }) {
    return NotificationItem(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      timestamp: timestamp ?? this.timestamp,
      isRead: isRead ?? this.isRead,
    );
  }
}

class OrderStatusUpdate {
  final String orderId;
  final String status;
  final String message;
  final DateTime timestamp;
  final bool isRead;

  OrderStatusUpdate({
    required this.orderId,
    required this.status,
    required this.message,
    required this.timestamp,
    required this.isRead,
  });

  OrderStatusUpdate copyWith({
    String? orderId,
    String? status,
    String? message,
    DateTime? timestamp,
    bool? isRead,
  }) {
    return OrderStatusUpdate(
      orderId: orderId ?? this.orderId,
      status: status ?? this.status,
      message: message ?? this.message,
      timestamp: timestamp ?? this.timestamp,
      isRead: isRead ?? this.isRead,
    );
  }
}
