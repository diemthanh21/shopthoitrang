import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/exchange_provider.dart';
import '../widgets/section_card.dart';
import '../widgets/status_badge.dart';
import '../utils/return_exchange_status.dart';
import '../services/doihang_service.dart';

class ExchangeDetailScreen extends StatefulWidget {
  final int maDoiHang;
  const ExchangeDetailScreen({super.key, required this.maDoiHang});

  @override
  State<ExchangeDetailScreen> createState() => _ExchangeDetailScreenState();
}

class _ExchangeDetailScreenState extends State<ExchangeDetailScreen> {
  List<dynamic> _logs = [];
  bool _loadingLogs = true;
  String? _errLogs;
  bool _loadingDetail = true;

  // Màu chủ đạo xanh biển
  static const Color primaryOcean = Color(0xFF006B96);
  static const Color lightOcean = Color(0xFF0088BD);
  static const Color darkOcean = Color(0xFF004D6D);
  static const Color accentOcean = Color(0xFF00A8E8);
  static const Color backgroundOcean = Color(0xFFE8F4F8);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loadingLogs = true;
      _loadingDetail = true;
    });
    final prov = context.read<ExchangeProvider>();
    await Future.wait([
      prov.fetchDetail(widget.maDoiHang),
      _loadLogsInternal(),
    ]);
    if (!mounted) return;
    setState(() {
      _loadingDetail = false;
    });
  }

  Future<void> _loadLogsInternal() async {
    try {
      final logs = await doiHangService.getLogs(widget.maDoiHang);
      if (!mounted) return;
      setState(() {
        _logs = logs ?? [];
        _loadingLogs = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errLogs = e.toString();
        _loadingLogs = false;
      });
    }
  }

  Widget _header(Map<String, dynamic> d) {
    final st = (d['trangthai'] ?? '').toString();
    final maDoiHang = d['madoihang'] ?? d['maDoiHang'] ?? widget.maDoiHang;
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primaryOcean, lightOcean],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: primaryOcean.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.sync_alt,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Phiếu đổi hàng',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '#$maDoiHang',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          StatusBadge(
            code: st,
            labels: ExchangeStatusMapper.labels,
            colorOf: ExchangeStatusMapper.color,
          ),
        ],
      ),
    );
  }

  Widget _info(Map<String, dynamic> d) {
    final details = (d['chitietdoihang'] as List?) ?? [];
    final imageLinks = <String>{};
    final videoLinks = <String>{};
    
    void addLink(dynamic value, Set<String> target) {
      if (value is String) {
        final trimmed = value.trim();
        if (trimmed.isNotEmpty) target.add(trimmed);
      } else if (value is List) {
        for (final entry in value) {
          if (entry is String) {
            final trimmed = entry.trim();
            if (trimmed.isNotEmpty) target.add(trimmed);
          }
        }
      }
    }
    
    for (final detail in details) {
      if (detail is! Map<String, dynamic>) continue;
      final parsed = _parseAttachmentNote(
        detail['hinhanh'],
      );
      if (parsed == null) continue;
      addLink(parsed['imageEvidence'], imageLinks);
      addLink(parsed['videoEvidence'], videoLinks);
    }
    
    final imageList = imageLinks.toList();
    final videoList = videoLinks.toList();
    final orderId = d['madonhang'] ?? d['maDonHang'] ?? '--';
    final reason = d['lydo'] ?? d['lyDo'] ?? '--';
    final requestDate = d['ngayyeucau'] ?? d['ngayYeuCau'] ?? '--';
    
    return _oceanCard(
      title: 'Thông tin đơn đổi',
      icon: Icons.info_outline,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _infoRow(Icons.receipt_long_outlined, 'Đơn gốc', '#$orderId'),
          const SizedBox(height: 12),
          _infoRow(Icons.edit_note, 'Lý do đổi', reason),
          const SizedBox(height: 12),
          _infoRow(Icons.calendar_today, 'Ngày yêu cầu', requestDate.toString().split('.')[0]),
          
          if (details.isNotEmpty) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: backgroundOcean.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: lightOcean.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.swap_horiz, color: primaryOcean, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Chi tiết sản phẩm đổi',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: darkOcean,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...details
                      .map((detail) => _detailLine(detail as Map<String, dynamic>))
                      .toList(),
                ],
              ),
            ),
          ],
          
          if (imageList.isNotEmpty || videoList.isNotEmpty) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: backgroundOcean.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: lightOcean.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.attach_file, color: primaryOcean, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Minh chứng',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: darkOcean,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...imageList.asMap().entries.map((entry) => _attachmentRow(
                      Icons.image,
                      imageList.length > 1
                          ? 'Hình ảnh #${entry.key + 1}'
                          : 'Hình ảnh',
                      entry.value)),
                  ...videoList.asMap().entries.map((entry) => _attachmentRow(
                      Icons.videocam,
                      videoList.length > 1
                          ? 'Video #${entry.key + 1}'
                          : 'Video',
                      entry.value)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _shipping(Map<String, dynamic> d) {
    final st = (d['trangthai'] ?? '').toString();
    final diaChi = d['diachiguihang'];
    final huongDan = d['huongdan_donggoi'];
    
    // Chỉ hiển thị khi có thông tin giao hàng
    if (diaChi == null && huongDan == null) {
      return const SizedBox();
    }
    
    return _oceanCard(
      title: 'Thông tin gửi hàng cũ',
      icon: Icons.local_shipping_outlined,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (diaChi != null)
            _infoRow(Icons.location_on_outlined, 'Địa chỉ gửi', diaChi.toString()),
          if (diaChi != null && huongDan != null)
            const SizedBox(height: 12),
          if (huongDan != null)
            _infoRow(Icons.description_outlined, 'Hướng dẫn đóng gói', huongDan.toString()),
        ],
      ),
    );
  }

  Widget _orderInfo(Map<String, dynamic> d) {
    final madonhangmoi = d['madonhangmoi'];
    final ngaytaodonmoi = d['ngaytaodonmoi'];
    final ngayduyet = d['ngayduyet'];
    final ngaynhanhangcu = d['ngaynhanhangcu'];
    final ngaykiemtra = d['ngaykiemtra'];
    final trangthaikiemtra = d['trangthaikiemtra'];
    
    if (madonhangmoi == null && ngayduyet == null && ngaynhanhangcu == null) {
      return const SizedBox();
    }
    
    return _oceanCard(
      title: 'Tiến trình xử lý',
      icon: Icons.trending_up,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (ngayduyet != null) ...[
            _infoRow(Icons.check_circle_outline, 'Ngày duyệt', ngayduyet.toString().split('.')[0]),
            const SizedBox(height: 12),
          ],
          if (ngaynhanhangcu != null) ...[
            _infoRow(Icons.inventory_2_outlined, 'Ngày nhận hàng cũ', ngaynhanhangcu.toString().split('.')[0]),
            const SizedBox(height: 12),
          ],
          if (ngaykiemtra != null) ...[
            _infoRow(Icons.search, 'Ngày kiểm tra', ngaykiemtra.toString().split('.')[0]),
            const SizedBox(height: 12),
          ],
          if (trangthaikiemtra != null) ...[
            _infoRow(Icons.assignment_turned_in, 'Trạng thái kiểm tra', trangthaikiemtra.toString()),
            const SizedBox(height: 12),
          ],
          if (madonhangmoi != null) ...[
            _infoRow(Icons.receipt, 'Đơn hàng mới', '#$madonhangmoi'),
            if (ngaytaodonmoi != null) ...[
              const SizedBox(height: 12),
              _infoRow(Icons.calendar_today, 'Ngày tạo đơn mới', ngaytaodonmoi.toString().split('.')[0]),
            ],
          ],
        ],
      ),
    );
  }

  Widget _finance(Map<String, dynamic> d) {
    final trangthaitien = d['trangthaitien'];
    final phuongthuc = d['phuongthuc_xuly_chenhlech'];
    final voucherCode = d['voucher_code'];
    final voucherAmount = d['voucher_amount'];
    
    if (trangthaitien == null && phuongthuc == null && voucherCode == null) {
      return const SizedBox();
    }
    
    return _oceanCard(
      title: 'Thông tin tài chính',
      icon: Icons.attach_money,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (trangthaitien != null) ...[
            _infoRow(Icons.account_balance_wallet, 'Trạng thái tiền', trangthaitien.toString()),
            const SizedBox(height: 12),
          ],
          if (phuongthuc != null) ...[
            _infoRow(Icons.payment, 'Phương thức xử lý', phuongthuc.toString()),
            const SizedBox(height: 12),
          ],
          if (voucherCode != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.card_giftcard, color: Colors.green.shade700, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Mã voucher',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          voucherCode.toString(),
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Colors.green.shade700,
                          ),
                        ),
                        if (voucherAmount != null)
                          Text(
                            'Giảm: ${voucherAmount}đ',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: accentOcean.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: primaryOcean, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: darkOcean,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _detailLine(Map<String, dynamic> detail) {
    final oldLabel = _variantLabel(
      detail['variantCu'] ?? detail['variant_cu'],
      detail['machitietsanphamcu'],
    );
    final newLabel = _variantLabel(
      detail['variantMoi'] ?? detail['variant_moi'],
      detail['machitietsanphammoi'],
    );
    final qty = detail['soluong'] ?? detail['soLuong'] ?? 0;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: lightOcean.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Cũ',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.red.shade700,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  oldLabel,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: darkOcean,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.arrow_downward, color: lightOcean, size: 16),
              const SizedBox(width: 8),
              Text(
                'Đổi sang',
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Mới',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.green.shade700,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  newLabel,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: darkOcean,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.shopping_bag_outlined, color: accentOcean, size: 14),
              const SizedBox(width: 6),
              Text(
                'Số lượng: $qty',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: accentOcean,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _variantLabel(dynamic variant, dynamic fallbackId) {
    if (variant is Map<String, dynamic>) {
      final name = variant['tensanpham'] ??
          variant['tenSanPham'] ??
          variant['productName'] ??
          'SP #$fallbackId';
      final color = variant['mausac'] ?? variant['color'];
      final size = variant['kichthuoc'] ?? variant['size'];
      final parts = [
        if (color != null && color.toString().isNotEmpty) color.toString(),
        if (size != null && size.toString().isNotEmpty) 'Size $size',
      ].join(' - ');
      return parts.isNotEmpty ? '$name ($parts)' : name.toString();
    }
    return 'SP #$fallbackId';
  }

  Map<String, dynamic>? _parseAttachmentNote(dynamic source) {
    if (source == null) return null;
    if (source is Map<String, dynamic>) return source;
    final raw = source.toString().trim();
    if (raw.isEmpty) return null;
    try {
      final parsed = jsonDecode(raw);
      if (parsed is Map<String, dynamic>) {
        return Map<String, dynamic>.from(parsed);
      }
    } catch (_) {
      if (raw.startsWith('http')) {
        return {'imageEvidence': raw};
      }
    }
    return null;
  }

  Widget _attachmentRow(IconData icon, String label, String url) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: lightOcean.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: lightOcean, size: 16),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: darkOcean,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          SelectableText(
            url,
            style: TextStyle(
              color: lightOcean,
              fontSize: 12,
              decoration: TextDecoration.underline,
            ),
          ),
        ],
      ),
    );
  }

  Widget _oceanCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: primaryOcean.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: accentOcean.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: primaryOcean, size: 22),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: darkOcean,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final detail = context.watch<ExchangeProvider>().details[widget.maDoiHang];
    
    return Scaffold(
      backgroundColor: backgroundOcean,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Chi tiết đổi hàng #${widget.maDoiHang}',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: primaryOcean,
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [primaryOcean, lightOcean],
            ),
          ),
        ),
      ),
      body: (_loadingDetail && detail == null)
          ? Center(
              child: CircularProgressIndicator(
                color: lightOcean,
              ),
            )
          : RefreshIndicator(
              color: lightOcean,
              onRefresh: _load,
              child: ListView(
                children: [
                  if (detail != null) _header(detail),
                  if (detail != null) _info(detail),
                  if (detail != null) _orderInfo(detail),
                  if (detail != null) _shipping(detail),
                  if (detail != null) _finance(detail),
                  
                  // Timeline
                  _oceanCard(
                    title: 'Lịch sử thay đổi',
                    icon: Icons.timeline,
                    child: _loadingLogs
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: CircularProgressIndicator(color: lightOcean),
                            ),
                          )
                        : _errLogs != null
                            ? Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  _errLogs!,
                                  style: TextStyle(color: Colors.red.shade700),
                                ),
                              )
                            : _logs.isEmpty
                                ? Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(20),
                                      child: Column(
                                        children: [
                                          Icon(
                                            Icons.history,
                                            size: 48,
                                            color: Colors.grey.shade400,
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            'Chưa có lịch sử',
                                            style: TextStyle(
                                              color: Colors.grey.shade600,
                                              fontSize: 14,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  )
                                : Column(
                                    children: _logs.asMap().entries.map((entry) {
                                      final log = entry.value;
                                      final isLast = entry.key == _logs.length - 1;
                                      final action = log['action'] ??
                                          log['hanh_dong'] ??
                                          '';
                                      final note =
                                          log['note'] ?? log['ghichu'] ?? '';
                                      final time = log['created_at'] ??
                                          log['thoigian'] ??
                                          '';
                                      
                                      return Container(
                                        margin: EdgeInsets.only(
                                          bottom: isLast ? 0 : 12,
                                        ),
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: backgroundOcean.withOpacity(0.5),
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(
                                            color: lightOcean.withOpacity(0.2),
                                          ),
                                        ),
                                        child: Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(8),
                                              decoration: BoxDecoration(
                                                color: accentOcean.withOpacity(0.1),
                                                shape: BoxShape.circle,
                                              ),
                                              child: Icon(
                                                Icons.check_circle,
                                                color: accentOcean,
                                                size: 18,
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    action.toString(),
                                                    style: TextStyle(
                                                      fontWeight: FontWeight.w700,
                                                      fontSize: 14,
                                                      color: darkOcean,
                                                    ),
                                                  ),
                                                  if (note.toString().isNotEmpty) ...[
                                                    const SizedBox(height: 4),
                                                    Text(
                                                      note.toString(),
                                                      style: TextStyle(
                                                        fontSize: 13,
                                                        color: Colors.grey[600],
                                                      ),
                                                    ),
                                                  ],
                                                  const SizedBox(height: 6),
                                                  Row(
                                                    children: [
                                                      Icon(
                                                        Icons.access_time,
                                                        size: 12,
                                                        color: Colors.grey[500],
                                                      ),
                                                      const SizedBox(width: 4),
                                                      Text(
                                                        time.toString().split('.')[0],
                                                        style: TextStyle(
                                                          fontSize: 11,
                                                          color: Colors.grey[500],
                                                          fontWeight: FontWeight.w500,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    }).toList(),
                                  ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }
}
