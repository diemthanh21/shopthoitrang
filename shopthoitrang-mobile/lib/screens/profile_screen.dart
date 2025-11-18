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
      // Load membership và loyalty points
      final membership =
          await _membershipService.getMembershipCard(user.maKhachHang);
      final loyalty =
          await _membershipService.getLoyaltyPoints(user.maKhachHang);

      if (mounted) {
        setState(() {
          _membershipCard = membership;
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
                colors: [Colors.orange, Colors.deepOrange],
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
                    Text(
                      _membershipCard?.tenHang ?? 'Thành viên',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (_membershipCard?.giamGia != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'Giảm ${(_membershipCard!.giamGia! * 100).toInt()}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                if (_loyaltyPoints != null) ...[
                  Text(
                    'Tích lũy: ${formatter.format(_loyaltyPoints!.tongChiTichLuy ?? 0)} đ',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Chi tiêu năm nay: ${formatter.format(_loyaltyPoints!.tongChiNam ?? 0)} đ',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 14,
                    ),
                  ),
                ],
                if (_membershipCard?.uuDai != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Ưu đãi: ${_membershipCard!.uuDai}',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
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
