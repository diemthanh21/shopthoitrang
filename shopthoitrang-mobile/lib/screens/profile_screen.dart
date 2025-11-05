import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user_model.dart';
import '../services/api_client.dart';
import '../services/user_service.dart';
import '../providers/auth_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  User? _user;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final api = ApiClient();
      final userService = UserService(api);
      final user = await userService.getCurrentUser();

      if (mounted) {
        setState(() {
          _user = user;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có chắc muốn đăng xuất?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Đăng xuất'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      // Sử dụng AuthProvider để logout
      final auth = context.read<AuthProvider>();
      await auth.logout();

      if (mounted) {
        // Điều hướng về login và xóa toàn bộ navigation stack
        Navigator.of(context).pushNamedAndRemoveUntil(
          '/login',
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: const Color(0xFF00B4D8),
        elevation: 0,
        title: const Text(
          'Tài khoản',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.shopping_cart, color: Colors.white),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadUserProfile,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadUserProfile,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: [
                        // Header với thông tin user
                        _buildUserHeader(),
                        const SizedBox(height: 8),

                        // Đơn mua
                        _buildOrderSection(),
                        const SizedBox(height: 8),

                        // Tiện ích
                        _buildUtilitiesSection(),
                        const SizedBox(height: 8),

                        // Dịch vụ tài chính
                        _buildFinancialSection(),
                        const SizedBox(height: 8),

                        // Tiện ích khác
                        _buildOtherSection(),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildUserHeader() {
    final user = _user;
    if (user == null) return const SizedBox.shrink();

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF00B4D8), Color(0xFF0077B6)],
              ),
            ),
            child: Center(
              child: Text(
                user.displayName.isNotEmpty
                    ? user.displayName[0].toUpperCase()
                    : 'U',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.displayName,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      '0 Người theo dõi',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      '0 Đang theo dõi',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () {},
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: Colors.grey[300]!),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            ),
            child: const Text(
              'Bạc',
              style: TextStyle(
                color: Colors.black87,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderSection() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Đơn mua',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                TextButton(
                  onPressed: () {},
                  child: const Row(
                    children: [
                      Text('Xem lịch sử mua hàng'),
                      Icon(Icons.chevron_right, size: 18),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildOrderItem(Icons.wallet, 'Chờ xác nhận', 0),
              _buildOrderItem(Icons.inventory_2_outlined, 'Chờ lấy hàng', 0),
              _buildOrderItem(
                  Icons.local_shipping_outlined, 'Chờ giao hàng', 1),
              _buildOrderItem(Icons.star_border, 'Đánh giá', 5),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOrderItem(IconData icon, String label, int count) {
    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Icon(icon, size: 28, color: Colors.grey[700]),
            if (count > 0)
              Positioned(
                right: -8,
                top: -4,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 18,
                    minHeight: 18,
                  ),
                  child: Text(
                    count > 99 ? '99+' : '$count',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[700],
          ),
        ),
      ],
    );
  }

  Widget _buildUtilitiesSection() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Tiện ích của tôi',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildUtilityItem(
                Icons.account_balance_wallet,
                'Ví ShopeePay',
                'Gói voucher\n1.000.000Đ',
                Colors.blue,
              ),
              _buildUtilityItem(
                Icons.currency_exchange,
                'SPayLater',
                'đ 8.000.000',
                Colors.orange,
              ),
              _buildUtilityItem(
                Icons.monetization_on_outlined,
                'Shopee Xu',
                '0 xu',
                Colors.orange,
              ),
              _buildUtilityItem(
                Icons.confirmation_number_outlined,
                'Kho Voucher',
                '50+ Voucher',
                Colors.red,
                badge: true,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUtilityItem(
    IconData icon,
    String title,
    String subtitle,
    Color color, {
    bool badge = false,
  }) {
    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            if (badge)
              Positioned(
                right: -4,
                top: -4,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 8,
                    minHeight: 8,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 2),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 10,
            color: Colors.red[700],
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
        ),
      ],
    );
  }

  Widget _buildFinancialSection() {
    return Container(
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Dịch vụ tài chính',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                TextButton(
                  onPressed: () {},
                  child: const Row(
                    children: [
                      Text('Xem thêm'),
                      Icon(Icons.chevron_right, size: 18),
                    ],
                  ),
                ),
              ],
            ),
          ),
          _buildMenuItem(
            Icons.currency_exchange,
            'Vay Tiêu Dùng',
            'Miễn lãi kỳ đầu tiên',
            badge: 'Mới',
            badgeColor: Colors.red,
          ),
          _buildMenuItem(
            Icons.payment,
            'Tài ShopeePay',
            'Gói voucher 1.000.000Đ',
          ),
          _buildMenuItem(
            Icons.security,
            'Bảo hiểm của tôi',
            'Gói Tai nạn MINI miễn phí',
          ),
        ],
      ),
    );
  }

  Widget _buildOtherSection() {
    return Container(
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Tiện ích khác',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                TextButton(
                  onPressed: () {},
                  child: const Row(
                    children: [
                      Text('Xem tất cả'),
                      Icon(Icons.chevron_right, size: 18),
                    ],
                  ),
                ),
              ],
            ),
          ),
          _buildMenuItem(Icons.favorite_border, 'Đã thích', ''),
          _buildMenuItem(Icons.visibility_outlined, 'Đã xem gần đây', ''),
          _buildMenuItem(Icons.rate_review_outlined, 'Đánh giá của tôi', ''),
          _buildMenuItem(Icons.settings, 'Cài đặt', ''),
          _buildMenuItem(
            Icons.logout,
            'Đăng xuất',
            '',
            textColor: Colors.red,
            onTap: _logout,
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    IconData icon,
    String title,
    String subtitle, {
    String? badge,
    Color? badgeColor,
    Color? textColor,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(icon, color: textColor ?? Colors.grey[700], size: 24),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 15,
                          color: textColor ?? Colors.black87,
                        ),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: badgeColor ?? Colors.red,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            badge,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (subtitle.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.red[700],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey[400], size: 20),
          ],
        ),
      ),
    );
  }
}
