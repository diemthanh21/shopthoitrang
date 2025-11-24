import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../services/membership_service.dart';
import '../models/membership_model.dart';

class MembershipCardScreen extends StatefulWidget {
  const MembershipCardScreen({super.key});

  @override
  State<MembershipCardScreen> createState() => _MembershipCardScreenState();
}

class _MembershipCardScreenState extends State<MembershipCardScreen> {
  final _membershipService = MembershipService();

  TheThanhVien? _membershipCard;
  PointsSummary? _pointsSummary;

  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final authProv = context.read<AuthProvider>();
    final user = authProv.user;
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      // Load thông tin thẻ và điểm
      final membership =
          await _membershipService.getMembershipCard(user.maKhachHang);
      final points =
          await _membershipService.getPointsSummary(user.maKhachHang);

      if (mounted) {
        setState(() {
          _membershipCard = membership;
          _pointsSummary = points;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Lỗi load dữ liệu: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Thẻ thành viên',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Thẻ thành viên với điểm
                    _buildMembershipCard(),
                    const SizedBox(height: 16),

                    // Điểm tích lũy chi tiết
                    _buildPointsDetail(),
                    const SizedBox(height: 16),

                    // Điểm pending (chờ duyệt)
                    if (_pointsSummary != null &&
                        _pointsSummary!.diemPending > 0) ...[
                      _buildPendingPoints(),
                      const SizedBox(height: 16),
                    ],

                    // Hướng dẫn sử dụng điểm
                    _buildPointsGuide(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMembershipCard() {
    final numberFormat = NumberFormat('#,###', 'vi_VN');
    final diemHienTai = _pointsSummary?.diemHienTai ?? 0;

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF667eea),
            Color(0xFF764ba2),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF667eea).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'THẺ THÀNH VIÊN',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 1.5,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'TÍCH ĐIỂM',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const Icon(
                  Icons.stars,
                  color: Colors.white,
                  size: 48,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Điểm hiện tại
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Điểm khả dụng',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        '1 điểm = 1,000 VND',
                        style: TextStyle(
                          color: Colors.white60,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    numberFormat.format(diemHienTai),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

            if (_membershipCard != null) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Ngày cấp',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      Text(
                        _membershipCard!.ngayCap != null
                            ? DateFormat('dd/MM/yyyy')
                                .format(_membershipCard!.ngayCap!)
                            : '--/--/----',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text(
                        'Trạng thái',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      Text(
                        _membershipCard!.trangThai == true
                            ? 'Đang hoạt động'
                            : 'Tạm ngưng',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPointsDetail() {
    final numberFormat = NumberFormat('#,###', 'vi_VN');
    final diemNamHienTai = _pointsSummary?.diemNamHienTai ?? 0;
    final namDiem = _pointsSummary?.namDiem ?? DateTime.now().year;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Tích lũy trong năm',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),

          // Điểm năm hiện tại
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Điểm tích lũy năm $namDiem:',
                  style: const TextStyle(fontSize: 14)),
              Text(
                numberFormat.format(diemNamHienTai),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.orange[200]!),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.orange[700], size: 20),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Điểm sẽ được reset về 0 vào đầu năm mới',
                    style: TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingPoints() {
    final numberFormat = NumberFormat('#,###', 'vi_VN');
    final diemPending = _pointsSummary?.diemPending ?? 0;
    final pendingTxs = _pointsSummary?.pendingTransactions ?? [];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.pending_actions, color: Colors.orange, size: 24),
              const SizedBox(width: 8),
              const Text(
                'Điểm chờ duyệt',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Tổng điểm pending
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange[50],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Tổng điểm chờ:',
                  style: TextStyle(fontSize: 14),
                ),
                Text(
                  numberFormat.format(diemPending),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Danh sách pending transactions
          if (pendingTxs.isNotEmpty) ...[
            const Divider(),
            const Text(
              'Chi tiết:',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            ...pendingTxs.take(5).map((tx) => _buildPendingTxItem(tx)),
          ],

          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Row(
              children: [
                Icon(Icons.access_time, color: Colors.blue[700], size: 18),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Điểm sẽ được duyệt sau 7 ngày kể từ ngày giao hàng',
                    style: TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingTxItem(PendingPointTransaction tx) {
    final numberFormat = NumberFormat('#,###', 'vi_VN');
    final dateFormat = DateFormat('dd/MM/yyyy');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          const Icon(Icons.circle, size: 6, color: Colors.grey),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Đơn #${tx.maDonHang}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (tx.availableAt != null)
                  Text(
                    'Duyệt vào: ${dateFormat.format(tx.availableAt!)}',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                    ),
                  ),
              ],
            ),
          ),
          Text(
            '+${numberFormat.format(tx.diem ?? 0)}',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.orange,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPointsGuide() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Cách tích và sử dụng điểm',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          _buildGuideItem(
            Icons.shopping_bag,
            'Tích điểm',
            'Mỗi 1,000 VND mua hàng = 1 điểm. Điểm sẽ được duyệt sau 7 ngày kể từ khi đơn hàng được giao thành công.',
          ),
          const SizedBox(height: 12),
          _buildGuideItem(
            Icons.discount,
            'Sử dụng điểm',
            'Sử dụng điểm khi thanh toán để giảm giá đơn hàng. 1 điểm = 1,000 VND giảm giá.',
          ),
          const SizedBox(height: 12),
          _buildGuideItem(
            Icons.calendar_today,
            'Reset hàng năm',
            'Điểm tích lũy sẽ được reset về 0 vào đầu năm mới. Hãy sử dụng điểm trước khi hết hạn!',
          ),
          const SizedBox(height: 12),
          _buildGuideItem(
            Icons.sync,
            'Trả/đổi hàng',
            'Nếu trả/đổi hàng trong 7 ngày, điểm pending sẽ được điều chỉnh theo giá trị đơn hàng còn lại.',
          ),
        ],
      ),
    );
  }

  Widget _buildGuideItem(IconData icon, String title, String description) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.purple[50],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Colors.purple[700], size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[700],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
