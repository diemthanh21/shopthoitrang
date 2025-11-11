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
  State<StatefulWidget> createState() => _ExchangeDetailScreenState();
}

class _ExchangeDetailScreenState extends State<ExchangeDetailScreen> {
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
    final prov = context.read<ExchangeProvider>();
    await Future.wait([
      prov.fetchDetail(widget.maDoiHang),
      _loadLogsInternal(),
    ]);
    if (mounted)
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
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      child: Row(children: [
        Expanded(
            child: Text('Đổi hàng #${d['madoihang']}',
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold))),
        StatusBadge(
            code: st,
            labels: ExchangeStatusMapper.labels,
            colorOf: ExchangeStatusMapper.color)
      ]),
    );
  }

  Widget _info(Map<String, dynamic> d) => SectionCard(
        title: 'Thông tin',
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Đơn: ${d['madonhang']}'),
          Text(
              'SP cũ: ${d['machitietsanphamcu']} -> SP mới: ${d['machitietsanphammoi']}'),
          Text('Số lượng: ${d['soluong']}'),
          Text('Lý do: ${d['lydo'] ?? ''}'),
          Text('Ngày yêu cầu: ${d['ngayyeucau'] ?? ''}'),
        ]),
      );

  Widget _shipping(Map<String, dynamic> d) {
    final st = d['trangthai'];
    if (st != 'DA_DUYET_CHO_GUI_HANG_CU' &&
        st != 'DA_NHAN_HANG_CU_CHO_KIEM_TRA') return const SizedBox();
    return SectionCard(
      title: 'Gửi hàng cũ',
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Địa chỉ gửi: ${d['diachiguihang'] ?? 'Chưa có'}'),
        Text('Hướng dẫn: ${d['huongdan_donggoi'] ?? '---'}'),
      ]),
    );
  }

  Widget _finance(Map<String, dynamic> d) {
    final chenhlech = d['chenhlech'];
    final voucherCode = d['voucher_code'];
    final voucherAmount = d['voucher_amount'];
    final trangthaitien = d['trangthaitien'];
    if (chenhlech == null && voucherCode == null) return const SizedBox();
    return SectionCard(
      title: 'Tài chính',
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (d['giacu'] != null) Text('Giá cũ: ${d['giacu']}'),
        if (d['giamoi'] != null) Text('Giá mới: ${d['giamoi']}'),
        if (chenhlech != null) Text('Chênh lệch: $chenhlech'),
        if (trangthaitien != null) Text('Trạng thái tiền: $trangthaitien'),
        if (voucherCode != null)
          Text('Voucher: $voucherCode (-$voucherAmount)'),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final detail = context.watch<ExchangeProvider>().details[widget.maDoiHang];
    return Scaffold(
      appBar: AppBar(title: Text('Đổi hàng #${widget.maDoiHang}')),
      body: (_loadingDetail && detail == null)
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                children: [
                  if (detail != null) _header(detail),
                  if (detail != null) _info(detail),
                  if (detail != null) _shipping(detail),
                  if (detail != null) _finance(detail),
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
