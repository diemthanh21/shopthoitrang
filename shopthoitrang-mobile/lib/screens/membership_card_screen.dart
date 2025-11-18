import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../services/membership_service.dart';
import '../services/hangthe_service.dart';
import '../models/membership_model.dart';

class MembershipCardScreen extends StatefulWidget {
  const MembershipCardScreen({super.key});

  @override
  State<MembershipCardScreen> createState() => _MembershipCardScreenState();
}

class _MembershipCardScreenState extends State<MembershipCardScreen> {
  final _membershipService = MembershipService();
  final _hangTheService = HangTheService();

  TheThanhVien? _membershipCard;
  TichLuyChiTieu? _loyaltyPoints;
  List<HangThe> _allHangThe = [];
  HangThe? _currentHangThe;
  HangThe? _nextHangThe;

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
      // Load tất cả hạng thẻ
      final allHangThe = await _hangTheService.getAllHangThe();

      // Sort theo điều kiện năm tăng dần (Bạc < Vàng < Kim Cương)
      allHangThe
          .sort((a, b) => (a.dieuKienNam ?? 0).compareTo(b.dieuKienNam ?? 0));

      // Load thông tin thẻ và tích lũy
      final membership =
          await _membershipService.getMembershipCard(user.maKhachHang);
      final loyalty =
          await _membershipService.getLoyaltyPoints(user.maKhachHang);

      if (mounted) {
        setState(() {
          _allHangThe = allHangThe;
          _membershipCard = membership;
          _loyaltyPoints = loyalty;

          // Tìm hạng thẻ hiện tại
          if (membership?.maHangThe != null) {
            _currentHangThe = allHangThe.firstWhere(
              (h) => h.maHangThe == membership!.maHangThe,
              orElse: () => allHangThe.first,
            );

            // Tìm hạng thẻ tiếp theo
            final currentIndex = allHangThe.indexOf(_currentHangThe!);
            if (currentIndex < allHangThe.length - 1) {
              _nextHangThe = allHangThe[currentIndex + 1];
            }
          } else {
            // Chưa có thẻ -> hạng đầu tiên
            _currentHangThe = allHangThe.isNotEmpty ? allHangThe.first : null;
            _nextHangThe = allHangThe.length > 1 ? allHangThe[1] : null;
          }

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
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Thẻ thành viên
                  _buildMembershipCard(),
                  const SizedBox(height: 16),

                  // Tích lũy chi tiêu
                  _buildLoyaltySection(),
                  const SizedBox(height: 16),

                  // Hướng dẫn nâng hạng
                  _buildUpgradeGuide(),
                  const SizedBox(height: 16),

                  // Tất cả hạng thẻ
                  _buildAllTiers(),
                ],
              ),
            ),
    );
  }

  Widget _buildMembershipCard() {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

    Color getCardColor() {
      if (_currentHangThe == null) return Colors.grey;
      final ten = _currentHangThe!.tenHang?.toLowerCase() ?? '';
      if (ten.contains('bạc')) return Colors.grey[400]!;
      if (ten.contains('vàng')) return Colors.amber[600]!;
      if (ten.contains('kim')) return Colors.blue[300]!;
      return Colors.grey;
    }

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            getCardColor(),
            getCardColor().withOpacity(0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: getCardColor().withOpacity(0.3),
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
                  children: [
                    const Text(
                      'THẺ THÀNH VIÊN',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _currentHangThe?.tenHang?.toUpperCase() ?? 'CHƯA CÓ',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Icon(
                  _currentHangThe?.tenHang?.toLowerCase().contains('kim') ==
                          true
                      ? Icons.diamond
                      : Icons.card_membership,
                  color: Colors.white,
                  size: 48,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Quyền lợi
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildBenefitRow(
                    Icons.discount,
                    'Giảm giá',
                    '${_currentHangThe?.giamGia?.toStringAsFixed(0) ?? '0'}%',
                  ),
                  const Divider(color: Colors.white30, height: 16),
                  _buildBenefitRow(
                    Icons.card_giftcard,
                    'Voucher sinh nhật',
                    currencyFormat
                        .format(_currentHangThe?.voucherSinhNhat ?? 0),
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
                        'Hết hạn',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      Text(
                        _membershipCard!.ngayHetHan != null
                            ? DateFormat('dd/MM/yyyy')
                                .format(_membershipCard!.ngayHetHan!)
                            : '--/--/----',
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

  Widget _buildBenefitRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: Colors.white, size: 20),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildLoyaltySection() {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

    final tongChiNam = _loyaltyPoints?.tongChiNam ?? 0;
    final tongChiTichLuy = _loyaltyPoints?.tongChiTichLuy ?? 0;

    // Tính tiến độ nâng hạng
    double progress = 0;
    double target = 0;

    if (_nextHangThe != null) {
      // Ưu tiên điều kiện năm
      if (_nextHangThe!.dieuKienNam != null && _nextHangThe!.dieuKienNam! > 0) {
        target = _nextHangThe!.dieuKienNam!;
        progress = tongChiNam / target;
      }
      // Hoặc điều kiện tích lũy
      else if (_nextHangThe!.dieuKienTichLuy != null &&
          _nextHangThe!.dieuKienTichLuy! > 0) {
        target = _nextHangThe!.dieuKienTichLuy!;
        progress = tongChiTichLuy / target;
      }
    }

    progress = progress.clamp(0.0, 1.0);

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
            'Tích lũy chi tiêu',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),

          // Chi tiêu năm nay
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Chi tiêu năm nay:', style: TextStyle(fontSize: 14)),
              Text(
                currencyFormat.format(tongChiNam),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Tích lũy tổng
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Tích lũy tổng:', style: TextStyle(fontSize: 14)),
              Text(
                currencyFormat.format(tongChiTichLuy),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                ),
              ),
            ],
          ),

          if (_nextHangThe != null && target > 0) ...[
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),

            // Progress bar nâng hạng
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Tiến độ lên ${_nextHangThe!.tenHang}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      '${(progress * 100).toStringAsFixed(0)}%',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.green[700],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 12,
                    backgroundColor: Colors.grey[200],
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Colors.green[600]!,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Còn ${currencyFormat.format(target - (tongChiNam > tongChiTichLuy ? tongChiNam : tongChiTichLuy))} nữa',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildUpgradeGuide() {
    if (_nextHangThe == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.green[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.green[200]!),
        ),
        child: Row(
          children: [
            Icon(Icons.emoji_events, color: Colors.green[700], size: 32),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Chúc mừng! Bạn đã đạt hạng thẻ cao nhất.',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
      );
    }

    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.arrow_upward, color: Colors.orange[700], size: 24),
              const SizedBox(width: 8),
              const Text(
                'Cách nâng lên hạng tiếp theo',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_nextHangThe!.dieuKienNam != null &&
              _nextHangThe!.dieuKienNam! > 0)
            _buildConditionRow(
              'Chi tiêu trong năm',
              currencyFormat.format(_nextHangThe!.dieuKienNam),
            ),
          if (_nextHangThe!.dieuKienTichLuy != null &&
              _nextHangThe!.dieuKienTichLuy! > 0) ...[
            if (_nextHangThe!.dieuKienNam != null &&
                _nextHangThe!.dieuKienNam! > 0)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Center(
                    child: Text('HOẶC',
                        style: TextStyle(fontWeight: FontWeight.bold))),
              ),
            _buildConditionRow(
              'Tích lũy kể từ ${_currentHangThe?.tenHang ?? "đầu"}',
              currencyFormat.format(_nextHangThe!.dieuKienTichLuy),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildConditionRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(Icons.check_circle, color: Colors.orange[700], size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(label, style: const TextStyle(fontSize: 14)),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAllTiers() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tất cả hạng thẻ',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        ..._allHangThe.map((hangThe) => _buildTierCard(hangThe)).toList(),
      ],
    );
  }

  Widget _buildTierCard(HangThe hangThe) {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
    final isCurrentTier = hangThe.maHangThe == _currentHangThe?.maHangThe;

    Color getTierColor() {
      final ten = hangThe.tenHang?.toLowerCase() ?? '';
      if (ten.contains('bạc')) return Colors.grey[400]!;
      if (ten.contains('vàng')) return Colors.amber[600]!;
      if (ten.contains('kim')) return Colors.blue[300]!;
      return Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCurrentTier ? getTierColor() : Colors.grey[300]!,
          width: isCurrentTier ? 2 : 1,
        ),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: getTierColor().withOpacity(0.1),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: getTierColor(),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.star, color: Colors.white, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        hangThe.tenHang ?? '',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (isCurrentTier)
                        Container(
                          margin: const EdgeInsets.only(top: 4),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: getTierColor(),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Hạng hiện tại',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Điều kiện
                if (hangThe.dieuKienNam != null && hangThe.dieuKienNam! > 0)
                  _buildInfoRow(
                    Icons.calendar_today,
                    'Chi tiêu/năm',
                    currencyFormat.format(hangThe.dieuKienNam),
                  ),
                if (hangThe.dieuKienTichLuy != null &&
                    hangThe.dieuKienTichLuy! > 0)
                  _buildInfoRow(
                    Icons.trending_up,
                    'Tích lũy cần đạt',
                    currencyFormat.format(hangThe.dieuKienTichLuy),
                  ),
                const Divider(height: 24),

                // Quyền lợi
                _buildInfoRow(
                  Icons.discount,
                  'Giảm giá',
                  '${hangThe.giamGia?.toStringAsFixed(0) ?? '0'}%',
                  valueColor: Colors.orange,
                ),
                _buildInfoRow(
                  Icons.card_giftcard,
                  'Voucher sinh nhật',
                  currencyFormat.format(hangThe.voucherSinhNhat ?? 0),
                  valueColor: Colors.orange,
                ),

                if (hangThe.uuDai != null && hangThe.uuDai!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.amber[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.amber[200]!),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.stars, color: Colors.amber[700], size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            hangThe.uuDai!,
                            style: const TextStyle(fontSize: 13),
                          ),
                        ),
                      ],
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

  Widget _buildInfoRow(IconData icon, String label, String value,
      {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: TextStyle(fontSize: 14, color: Colors.grey[700]),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: valueColor ?? Colors.black87,
            ),
          ),
        ],
      ),
    );
  }
}
