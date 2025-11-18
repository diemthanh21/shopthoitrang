import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
// services removed from direct use; handled via providers
import '../utils/return_exchange_status.dart';
import '../widgets/status_badge.dart';
import '../providers/return_provider.dart';
import '../providers/exchange_provider.dart';
import 'return_detail_screen.dart';
import 'exchange_detail_screen.dart';
// Các yêu cầu đổi/trả nên khởi tạo từ màn hình chi tiết đơn hàng để chọn sản phẩm cụ thể.

/// Màn hình tổng hợp yêu cầu Trả hàng & Đổi hàng của khách
class ReturnsListScreen extends StatefulWidget {
  const ReturnsListScreen({super.key});

  @override
  State<ReturnsListScreen> createState() => _ReturnsListScreenState();
}

class _ReturnsListScreenState extends State<ReturnsListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _loadAll();
  }

  Future<void> _loadAll() async {
    await Future.wait([_loadReturns(), _loadExchanges()]);
  }

  Future<void> _loadReturns() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.user == null) return;
    await context.read<ReturnProvider>().fetchList();
  }

  Future<void> _loadExchanges() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.user == null) return;
    await context.read<ExchangeProvider>().fetchList(auth.user!.maKhachHang);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đổi / Trả hàng'),
        bottom: TabBar(
          controller: _tab,
          tabs: const [Tab(text: 'Trả hàng'), Tab(text: 'Đổi hàng')],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: [
          _buildReturns(),
          _buildExchanges(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateMenu(),
        label: const Text('Hướng dẫn tạo'),
        icon: const Icon(Icons.help_outline),
      ),
    );
  }

  void _showCreateMenu() async {
    final action = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.reply, color: Colors.red),
              title: const Text('Yêu cầu trả hàng'),
              onTap: () => Navigator.pop(ctx, 'return'),
            ),
            ListTile(
              leading: const Icon(Icons.autorenew, color: Colors.blue),
              title: const Text('Yêu cầu đổi hàng'),
              onTap: () => Navigator.pop(ctx, 'exchange'),
            ),
          ],
        ),
      ),
    );
    if (action == 'return' || action == 'exchange') {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text(
              'Vào chi tiết đơn hàng đã giao trong 7 ngày để tạo yêu cầu đổi/trả.')));
    }
  }

  Widget _buildReturns() {
    final prov = context.watch<ReturnProvider>();
    if (prov.loadingList)
      return const Center(child: CircularProgressIndicator());
    if (prov.listError != null)
      return Center(
          child:
              Text(prov.listError!, style: const TextStyle(color: Colors.red)));
    final list = prov.items;
    if (list.isEmpty)
      return const Center(child: Text('Chưa có yêu cầu trả hàng'));
    return RefreshIndicator(
      onRefresh: _loadReturns,
      child: ListView.builder(
        itemCount: list.length,
        itemBuilder: (ctx, i) {
          final r = list[i];
          final st = (r['trangthai'] ?? 'N/A').toString();
          return Card(
            margin: const EdgeInsets.fromLTRB(12, 8, 12, 8),
            child: ListTile(
              leading: const Icon(Icons.reply, color: Colors.red),
              title: Text('Trả hàng #${r['matrahang'] ?? r['id'] ?? ''}'),
              subtitle: StatusBadge(
                code: st,
                labels: ReturnStatusMapper.labels,
                colorOf: ReturnStatusMapper.color,
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                final id = r['matrahang'] ?? r['id'];
                if (id is int) {
                  await Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => ReturnDetailScreen(maTraHang: id)));
                  await _loadReturns();
                }
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildExchanges() {
    final prov = context.watch<ExchangeProvider>();
    if (prov.loadingList)
      return const Center(child: CircularProgressIndicator());
    if (prov.listError != null)
      return Center(
          child:
              Text(prov.listError!, style: const TextStyle(color: Colors.red)));
    final list = prov.items;
    if (list.isEmpty)
      return const Center(child: Text('Chưa có yêu cầu đổi hàng'));
    return RefreshIndicator(
      onRefresh: _loadExchanges,
      child: ListView.builder(
        itemCount: list.length,
        itemBuilder: (ctx, i) {
          final r = list[i];
          final st = (r['trangthai'] ?? 'N/A').toString();
          return Card(
            margin: const EdgeInsets.fromLTRB(12, 8, 12, 8),
            child: ListTile(
              leading: const Icon(Icons.autorenew, color: Colors.blue),
              title: Text('Đổi hàng #${r['madoihang'] ?? r['id'] ?? ''}'),
              subtitle: StatusBadge(
                code: st,
                labels: ExchangeStatusMapper.labels,
                colorOf: ExchangeStatusMapper.color,
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                final id = r['madoihang'] ?? r['id'];
                if (id is int) {
                  await Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => ExchangeDetailScreen(maDoiHang: id)));
                  await _loadExchanges();
                }
              },
            ),
          );
        },
      ),
    );
  }
}
