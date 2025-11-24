import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/notification_service.dart';
import '../services/api_client.dart';
import '../models/notification_model.dart';
import 'order_detail_screen.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late NotificationService _notificationService;

  static const Color primaryBlue = Color(0xFF0891B2);
  static const Color lightBlue = Color(0xFFE0F2FE);

  // ========================= DATA =========================
  List<PromotionNotification> _promos = [];
  List<OrderNotification> _orderUpdates = [];
  bool _loadingPromos = true;
  bool _loadingOrders = true;
  String? _errorPromos;
  String? _errorOrders;

  // ========================= SEARCH + PAGINATION =========================
  final int _pageSize = 10;

  String _promoQuery = '';
  String _orderQuery = '';

  int _promoPage = 1;
  int _orderPage = 1;

  final TextEditingController _promoSearchCtrl = TextEditingController();
  final TextEditingController _orderSearchCtrl = TextEditingController();

  // debounce timer
  Future<void>? _promoDebounce;
  Future<void>? _orderDebounce;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _notificationService = NotificationService(ApiClient());
    _loadData();
  }

  @override
  void dispose() {
    _promoSearchCtrl.dispose();
    _orderSearchCtrl.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    await Future.wait([_loadPromos(), _loadOrderUpdates()]);
  }

  // ========================= HELPERS =========================
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

  String _formatSimpleDate(DateTime date) =>
      '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';

  // ========================= LOADERS =========================
  Future<void> _loadPromos() async {
    try {
      setState(() {
        _loadingPromos = true;
        _errorPromos = null;
      });

      final promos = await _notificationService.getPromotions();

      if (mounted) {
        setState(() {
          _promos = promos;
          _loadingPromos = false;
          _promoPage = 1; // reset page on reload
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

      final customerId = auth.user?.maKhachHang?.toString();
      final orders = await _notificationService.getOrderUpdates(
        customerId: customerId,
      );

      if (mounted) {
        setState(() {
          _orderUpdates = orders;
          _loadingOrders = false;
          _orderPage = 1; // reset page on reload
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

  // ========================= SEARCH FILTERS =========================
  List<PromotionNotification> get _filteredPromos {
    final q = _promoQuery.trim().toLowerCase();
    if (q.isEmpty) return _promos;

    return _promos.where((p) {
      final title = p.title.toLowerCase();
      final msg = p.message.toLowerCase();
      final code = (p.voucherCode ?? '').toLowerCase();
      final tags = _formatDiscountInfo(p).toLowerCase();
      return title.contains(q) ||
          msg.contains(q) ||
          code.contains(q) ||
          tags.contains(q);
    }).toList();
  }

  List<OrderNotification> get _filteredOrders {
    final q = _orderQuery.trim().toLowerCase();
    if (q.isEmpty) return _orderUpdates;

    return _orderUpdates.where((o) {
      final code = o.orderCode.toLowerCase();
      final status = o.status.toLowerCase();
      final msg = (o.message ?? '').toLowerCase();
      return code.contains(q) || status.contains(q) || msg.contains(q);
    }).toList();
  }

  List<PromotionNotification> get _pagedPromos {
    final list = _filteredPromos;
    final end = (_promoPage * _pageSize).clamp(0, list.length);
    return list.take(end).toList();
  }

  List<OrderNotification> get _pagedOrders {
    final list = _filteredOrders;
    final end = (_orderPage * _pageSize).clamp(0, list.length);
    return list.take(end).toList();
  }

  bool get _promoHasMore =>
      _pagedPromos.length < _filteredPromos.length;

  bool get _orderHasMore =>
      _pagedOrders.length < _filteredOrders.length;

  void _onPromoSearchChanged(String value) {
    // debounce nhẹ để không setState liên tục
    _promoDebounce = Future.delayed(const Duration(milliseconds: 250), () {
      if (!mounted) return;
      setState(() {
        _promoQuery = value;
        _promoPage = 1; // reset page when searching
      });
    });
  }

  void _onOrderSearchChanged(String value) {
    _orderDebounce = Future.delayed(const Duration(milliseconds: 250), () {
      if (!mounted) return;
      setState(() {
        _orderQuery = value;
        _orderPage = 1; // reset page when searching
      });
    });
  }

  // ========================= DIALOGS =========================
  void _showPromotionDetail(BuildContext context, PromotionNotification promo) {
    final chips = <Widget>[];
    if (promo.discountPercent != null) {
      chips.add(_buildPromoChip(
        'Giảm ${promo.discountPercent!.toStringAsFixed(0)}%',
        Colors.red.shade700,
      ));
    }
    if (promo.discountAmount != null) {
      chips.add(_buildPromoChip(
        'Giảm ${_formatMoney(promo.discountAmount!)}',
        Colors.red.shade700,
      ));
    } else if (promo.voucherCode == null && promo.message.isNotEmpty) {
      chips.add(_buildPromoChip(promo.message, Colors.blueGrey.shade700));
    }

    final voucherCode = promo.voucherCode;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(promo.title),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                promo.message,
                style: const TextStyle(fontSize: 15),
              ),
              const SizedBox(height: 16),
              if (voucherCode != null && voucherCode.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: lightBlue,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: primaryBlue.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.local_offer, color: primaryBlue),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Mã khuyến mãi',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.black54,
                              ),
                            ),
                            Text(
                              voucherCode,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: primaryBlue,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: 'Sao chép',
                        icon: const Icon(Icons.copy, color: primaryBlue),
                        onPressed: () {
                          Clipboard.setData(
                            ClipboardData(text: voucherCode),
                          );
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Đã sao chép mã khuyến mãi'),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              if (chips.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: chips,
                ),
              ],
              const SizedBox(height: 12),
              if (promo.validFrom != null || promo.validUntil != null) ...[
                if (promo.validFrom != null)
                  _buildDetailRow(
                      'Từ ngày:', _formatSimpleDate(promo.validFrom!)),
                if (promo.validUntil != null) ...[
                  const SizedBox(height: 8),
                  _buildDetailRow(
                      'Đến ngày:', _formatSimpleDate(promo.validUntil!)),
                ],
                const SizedBox(height: 8),
              ],
              _buildDetailRow(
                'Cập nhật:',
                _formatTimestamp(promo.createdAt),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Đóng'),
          ),
          if (voucherCode != null)
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryBlue,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Clipboard.setData(ClipboardData(text: voucherCode));
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Mã $voucherCode đã được sao chép!'),
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
              final navigator = Navigator.of(context);
              navigator.pop();
              if (order.orderId == 0) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content:
                        Text('Không tìm thấy mã đơn hàng để xem chi tiết'),
                  ),
                );
                return;
              }
              navigator.push(
                MaterialPageRoute(
                  builder: (_) => OrderDetailScreen(orderId: order.orderId),
                ),
              );
            },
            child: const Text('Xem chi tiết'),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoChip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.35)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
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

  // ========================= UI =========================
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

  // ---------------- PROMOS TAB ----------------
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

    final visiblePromos = _pagedPromos;

    return RefreshIndicator(
      onRefresh: () async {
        await _loadPromos();
      },
      child: ListView.separated(
        padding: const EdgeInsets.all(8),
        itemCount: visiblePromos.length + 1, // + search/header/footer
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) {
          if (index == 0) {
            return _buildSearchBar(
              controller: _promoSearchCtrl,
              hint: "Tìm khuyến mãi theo tiêu đề / nội dung / mã...",
              onChanged: _onPromoSearchChanged,
              onClear: () {
                setState(() {
                  _promoSearchCtrl.clear();
                  _promoQuery = '';
                  _promoPage = 1;
                });
              },
            );
          }

          final realIndex = index - 1;

          if (realIndex >= visiblePromos.length) {
            // footer
            if (_filteredPromos.isEmpty) {
              return _buildEmptyState(
                icon: Icons.notifications_none,
                text: _promoQuery.isEmpty
                    ? 'Chưa có thông báo khuyến mãi'
                    : 'Không tìm thấy khuyến mãi phù hợp',
              );
            }
            if (_promoHasMore) {
              return _buildLoadMore(
                onTap: () => setState(() => _promoPage++),
              );
            }
            return const SizedBox.shrink();
          }

          final item = visiblePromos[realIndex];
          return _NotificationCard(
            title: item.title,
            message: item.message,
            voucherCode: item.voucherCode,
            discountInfo: _formatDiscountInfo(item),
            timestamp: item.createdAt,
            isRead: item.isRead,
            onTap: () {
              setState(() {
                final pos = _promos.indexWhere((e) => e.id == item.id);
                if (pos != -1) {
                  _promos[pos] = item.copyWith(isRead: true);
                }
              });
              _notificationService.markAsRead(item.id.toString(), 'promo');
              _showPromotionDetail(context, item);
            },
          );
        },
      ),
    );
  }

  // ---------------- ORDERS TAB ----------------
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

    final visibleOrders = _pagedOrders;

    return RefreshIndicator(
      onRefresh: () async {
        await _loadOrderUpdates();
      },
      child: ListView.separated(
        padding: const EdgeInsets.all(8),
        itemCount: visibleOrders.length + 1,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) {
          if (index == 0) {
            return _buildSearchBar(
              controller: _orderSearchCtrl,
              hint: "Tìm đơn hàng theo mã / trạng thái / ghi chú...",
              onChanged: _onOrderSearchChanged,
              onClear: () {
                setState(() {
                  _orderSearchCtrl.clear();
                  _orderQuery = '';
                  _orderPage = 1;
                });
              },
            );
          }

          final realIndex = index - 1;

          if (realIndex >= visibleOrders.length) {
            if (_filteredOrders.isEmpty) {
              return _buildEmptyState(
                icon: Icons.shopping_bag_outlined,
                text: _orderQuery.isEmpty
                    ? 'Chưa có cập nhật đơn hàng'
                    : 'Không tìm thấy đơn hàng phù hợp',
              );
            }
            if (_orderHasMore) {
              return _buildLoadMore(
                onTap: () => setState(() => _orderPage++),
              );
            }
            return const SizedBox.shrink();
          }

          final update = visibleOrders[realIndex];
          return _OrderUpdateCard(
            orderId: update.orderCode,
            status: update.status,
            message: update.message ?? '',
            totalAmount: update.totalAmount,
            timestamp: update.statusUpdatedAt ?? update.orderDate,
            isRead: update.isRead,
            onTap: () {
              setState(() {
                final pos = _orderUpdates.indexWhere((e) => e.orderId == update.orderId);
                if (pos != -1) {
                  _orderUpdates[pos] = update.copyWith(isRead: true);
                }
              });
              _notificationService.markAsRead(
                  update.orderId.toString(), 'order');
              _showOrderDetail(context, update);
            },
          );
        },
      ),
    );
  }

  // ========================= SMALL COMPONENTS =========================
  Widget _buildSearchBar({
    required TextEditingController controller,
    required String hint,
    required ValueChanged<String> onChanged,
    required VoidCallback onClear,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [
          Icon(Icons.search, color: Colors.grey.shade600),
          const SizedBox(width: 6),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              decoration: InputDecoration(
                hintText: hint,
                border: InputBorder.none,
                isDense: true,
              ),
            ),
          ),
          if (controller.text.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: onClear,
            ),
        ],
      ),
    );
  }

  Widget _buildLoadMore({required VoidCallback onTap}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Center(
        child: OutlinedButton.icon(
          onPressed: onTap,
          icon: const Icon(Icons.expand_more),
          label: const Text("Xem thêm"),
        ),
      ),
    );
  }

  Widget _buildEmptyState({required IconData icon, required String text}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 80),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              text,
              style: TextStyle(color: Colors.grey[600], fontSize: 16),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ========================= CARDS =========================
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

// ========================= MODELS (giữ như cũ nếu bạn còn dùng) =========================
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
