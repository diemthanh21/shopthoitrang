import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_client.dart';
import '../services/product_service.dart';
import '../models/product.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  late final ProductService _productService;
  late Future<List<Product>> _future;

  @override
  void initState() {
    super.initState();
    _productService = ProductService(ApiClient());
    _future = _productService.getProducts();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cửa hàng'),
        actions: [
          IconButton(
            onPressed: () async {
              await auth.logout();
              if (mounted) Navigator.of(context).pop();
            },
            icon: const Icon(Icons.logout),
            tooltip: 'Đăng xuất',
          )
        ],
      ),
      body: FutureBuilder<List<Product>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(child: Text('Lỗi tải sản phẩm: ${snap.error}'));
          }
          final items = snap.data ?? [];
          if (items.isEmpty) return const Center(child: Text('Chưa có sản phẩm'));
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final p = items[i];
              return ListTile(
                leading: CircleAvatar(child: Text('${i+1}')),
                title: Text(p.name),
                subtitle: Text('${p.price} đ'),
                trailing: ElevatedButton(
                  onPressed: () {},
                  child: const Text('Mua'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
