import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/return_provider.dart';
import '../widgets/section_card.dart';
import '../widgets/status_badge.dart';
import '../utils/return_exchange_status.dart';
import '../services/trahang_service.dart';

class ReturnDetailScreen extends StatefulWidget {
  final int maTraHang;
  const ReturnDetailScreen({super.key, required this.maTraHang});

  @override
  State<StatefulWidget> createState() => _ReturnDetailScreenState();
}

class _ReturnDetailScreenState extends State<ReturnDetailScreen> {
  List<dynamic> _logs = [];
  bool _loadingLogs = true;
  String? _errLogs;
  bool _loadingDetail = true;

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
    final prov = context.read<ReturnProvider>();
    await Future.wait([
      prov.fetchDetail(widget.maTraHang),
      _loadLogsInternal(),
    ]);
    if (mounted)
      setState(() {
        _loadingDetail = false;
      });
  }

  Future<void> _loadLogsInternal() async {
    try {
      final logs = await trahangService.getLogs(widget.maTraHang);
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

  Widget _buildHeader(Map<String, dynamic> d) {
    final st = (d['trangthai'] ?? '').toString();
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      child: Row(
        children: [
          Expanded(
              child: Text('Trả hàng #${d['matrahang']}',
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold))),
          StatusBadge(
              code: st,
              labels: ReturnStatusMapper.labels,
              colorOf: ReturnStatusMapper.color)
        ],
      ),
    );
  }

  Widget _infoSection(Map<String, dynamic> d) {
    return SectionCard(
      title: 'Thông tin',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Đơn: ${d['madonhang']}'),
          Text('Sản phẩm: ${d['machitietsanpham']}'),
          Text('Số lượng: ${d['soluong']}'),
          Text('Lý do: ${d['lydo'] ?? ''}'),
          Text('Ngày yêu cầu: ${d['ngayyeucau'] ?? ''}'),
        ],
      ),
    );
  }

  Widget _shippingSection(Map<String, dynamic> d) {
    final st = d['trangthai'];
    if (st != 'DA_DUYET_CHO_GUI_HANG' && st != 'DA_NHAN_HANG_CHO_KIEM_TRA')
      return const SizedBox();
    return SectionCard(
      title: 'Gửi hàng',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Địa chỉ gửi: ${d['diachiguihang'] ?? 'Chưa có'}'),
          Text('Hướng dẫn: ${d['huongdan_donggoi'] ?? '---'}'),
        ],
      ),
    );
  }

  Widget _inspectionSection(Map<String, dynamic> d) {
    final st = d['trangthai'];
    if (st != 'KHONG_HOP_LE' &&
        st != 'DU_DIEU_KIEN_HOAN_TIEN' &&
        st != 'DA_HOAN_TIEN') return const SizedBox();
    return SectionCard(
      title: 'Kết quả kiểm tra',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Trạng thái: ${ReturnStatusMapper.labels[st] ?? st}'),
          if (st == 'KHONG_HOP_LE')
            Text('Lý do: ${d['ly_do_khong_hop_le'] ?? d['ghichu'] ?? ''}'),
        ],
      ),
    );
  }

  Widget _refundSection(Map<String, dynamic> d) {
    final st = d['trangthai'];
    if (st != 'DU_DIEU_KIEN_HOAN_TIEN' && st != 'DA_HOAN_TIEN')
      return const SizedBox();
    final soTien = d['sotien_hoan'];
    return SectionCard(
      title: 'Hoàn tiền',
      actions: [
        if (st == 'DU_DIEU_KIEN_HOAN_TIEN' && soTien == null)
          TextButton(
              onPressed: () async {
                final ok = await context
                    .read<ReturnProvider>()
                    .calcRefund(widget.maTraHang);
                if (!ok)
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Tính tiền thất bại')));
              },
              child: const Text('Tính tiền')),
        if (st == 'DU_DIEU_KIEN_HOAN_TIEN' && soTien != null)
          TextButton(
              onPressed: () async {
                final ok = await context
                    .read<ReturnProvider>()
                    .processRefund(widget.maTraHang);
                if (!ok)
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Hoàn tiền thất bại')));
              },
              child: const Text('Hoàn tiền'))
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Số tiền hoàn: ${soTien ?? 'Chưa tính'}'),
          if (d['phuongthuc_hoan'] != null)
            Text('Phương thức: ${d['phuongthuc_hoan']}'),
          if (d['ngayhoantien'] != null)
            Text('Ngày hoàn: ${d['ngayhoantien']}'),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final detail = context.watch<ReturnProvider>().details[widget.maTraHang];
    return Scaffold(
      appBar: AppBar(title: Text('Trả hàng #${widget.maTraHang}')),
      body: (_loadingDetail && detail == null)
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                children: [
                  if (detail != null) _buildHeader(detail),
                  if (detail != null) _infoSection(detail),
                  if (detail != null) _shippingSection(detail),
                  if (detail != null) _inspectionSection(detail),
                  if (detail != null) _refundSection(detail),
                  SectionCard(
                    title: 'Timeline',
                    child: _loadingLogs
                        ? const Center(child: CircularProgressIndicator())
                        : _errLogs != null
                            ? Text(_errLogs!,
                                style: const TextStyle(color: Colors.red))
                            : _logs.isEmpty
                                ? const Text('Chưa có lịch sử')
                                : Column(
                                    children: _logs.map((log) {
                                      final action = log['action'] ??
                                          log['hanh_dong'] ??
                                          '';
                                      final note =
                                          log['note'] ?? log['ghichu'] ?? '';
                                      final time = log['created_at'] ??
                                          log['thoigian'] ??
                                          '';
                                      return ListTile(
                                        leading: const Icon(Icons.timeline),
                                        title: Text(action.toString()),
                                        subtitle: Text(note.toString()),
                                        trailing: Text(time.toString(),
                                            style: const TextStyle(
                                                fontSize: 12,
                                                color: Colors.grey)),
                                      );
                                    }).toList(),
                                  ),
                  )
                ],
              ),
            ),
    );
  }
}
