import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../services/membership_service.dart';
import '../models/membership_model.dart';
import 'address_management_screen.dart';
import 'membership_card_screen.dart';
import 'account_info_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _membershipService = MembershipService();

  TheThanhVien? _membershipCard;
  PointsSummary? _pointsSummary;
  TichLuyChiTieu? _loyaltyPoints;

  @override
  void initState() {
    super.initState();
    _loadExtraData();
  }

  Future<void> _loadExtraData() async {
    final authProv = context.read<AuthProvider>();
    final user = authProv.user;
    if (user == null) return;

    try {
      // Load membership card, points và loyalty
      final membership =
          await _membershipService.getMembershipCard(user.maKhachHang);
      final points =
          await _membershipService.getPointsSummary(user.maKhachHang);
      final loyalty =
          await _membershipService.getLoyaltyPoints(user.maKhachHang);

      if (mounted) {
        setState(() {
          _membershipCard = membership;
          _pointsSummary = points;
          _loyaltyPoints = loyalty;
        });
      }
    } catch (e) {
      print('Lỗi load dữ liệu bổ sung: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProv = context.watch<AuthProvider>();
    final user = authProv.user;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Tài khoản',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.black87),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // User Info - No click action
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: Colors.orange,
                    child: Text(
                      user != null && user.hoTen.isNotEmpty
                          ? user.hoTen.substring(0, 1).toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.hoTen ?? 'Người dùng',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user?.email ?? '',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // Membership Card Section
            if (_membershipCard != null) _buildMembershipSection(),

            if (_membershipCard != null) const SizedBox(height: 8),

            // Settings
            Container(
              color: Colors.white,
              child: Column(
                children: [
                  // Thông tin tài khoản
                  ListTile(
                    leading:
                        const Icon(Icons.person_outline, color: Colors.blue),
                    title: const Text('Thông tin tài khoản'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const AccountInfoScreen(),
                        ),
                      );
                      // Reload data after returning
                      _loadExtraData();
                    },
                  ),
                  const Divider(height: 1),
                  // Địa chỉ giao hàng
                  _buildAddressSection(),
                  const Divider(height: 1),
                  ListTile(
                    leading:
                        const Icon(Icons.card_membership, color: Colors.purple),
                    title: const Text('Thẻ thành viên'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const MembershipCardScreen(),
                        ),
                      );
                      // Reload data after returning
                      _loadExtraData();
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.help_outline, color: Colors.blue),
                    title: const Text('Hỗ trợ'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {},
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Logout Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ElevatedButton(
                onPressed: () async {
                  await authProv.logout();
                  if (!context.mounted) return;
                  Navigator.of(context).pushNamedAndRemoveUntil(
                    '/login',
                    (route) => false,
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Đăng xuất',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildMembershipSection() {
    final formatter = NumberFormat('#,###', 'vi_VN');
    final diemHienTai = _pointsSummary?.diemHienTai ?? 0;
    final diemPending = _pointsSummary?.diemPending ?? 0;

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Thẻ thành viên',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'TÍCH ĐIỂM',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.stars, color: Colors.white, size: 16),
                          SizedBox(width: 4),
                          Text(
                            'Thành viên',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Điểm hiện tại
                Row(
                  children: [
                    const Icon(Icons.account_balance_wallet,
                        color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      'Điểm khả dụng:',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      formatter.format(diemHienTai),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                if (diemPending > 0) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.pending_actions,
                          color: Colors.white70, size: 18),
                      const SizedBox(width: 8),
                      const Text(
                        'Điểm chờ duyệt:',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 13,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        formatter.format(diemPending),
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.9),
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
                if (_loyaltyPoints != null) ...[
                  const SizedBox(height: 12),
                  const Divider(color: Colors.white30),
                  const SizedBox(height: 8),
                  Text(
                    'Chi tiêu năm nay: ${formatter.format(_loyaltyPoints!.tongChiNam ?? 0)} đ',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.85),
                      fontSize: 13,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressSection() {
    return ListTile(
      leading: const Icon(Icons.location_on_outlined, color: Colors.orange),
      title: const Text('Địa chỉ giao hàng'),
      trailing: const Icon(Icons.chevron_right),
      onTap: () async {
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const AddressManagementScreen(),
          ),
        );
        // Reload data after returning
        _loadExtraData();
      },
    );
  }
}
