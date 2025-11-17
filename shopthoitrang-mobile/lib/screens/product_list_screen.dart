import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'package:shopthoitrang_mobile/widgets/product_gallery_card.dart';
import '../services/product_service.dart';
import '../services/api_client.dart';
import '../models/product_model.dart' hide ProductStats;
import '../models/product_promotion_info.dart';
import 'product_detail_screen.dart';
import '../utils/datetime_utils.dart';

const Color _backgroundBlue = Color(0xFFF1F5FF);
const Color _primaryBlue = Color(0xFF1F6FEB);
const Color _secondaryBlue = Color(0xFF64B5F6);

// formatter cho tiền VNĐ
final NumberFormat _priceFormatter = NumberFormat.decimalPattern('vi_VN');


/// Card hiển thị sản phẩm trong grid
class _ProductCard extends StatelessWidget {
  final Product product;
  final String Function(String) buildImageUrl;
  final VoidCallback onTap;
  final ProductStats? stats;
  final ProductPromotionInfo? promo;

  const _ProductCard({
    required this.product,
    required this.buildImageUrl,
    required this.onTap,
    this.stats,
    this.promo,
  });

  @override
  Widget build(BuildContext context) {
    final cover = product.coverImage ??
        (product.variants.isNotEmpty && product.variants.first.images.isNotEmpty
            ? product.variants.first.images.first.url
            : null);

    final basePrice = product.variants.isNotEmpty
        ? product.variants.first.price
        : (product.minPrice ?? 0);

    // Tính giá sau khi giảm nếu có %
    double finalPrice = basePrice;
    final double? percent = promo?.percent;

    if (percent != null && percent > 0) {
      finalPrice = basePrice * (1 - percent / 100);
    }

    String formatPrice(num v) => '${_priceFormatter.format(v)}đ';

    final df = DateFormat('dd/MM/yyyy HH:mm', 'vi_VN');

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(.05),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
          border: Border.all(color: _primaryBlue.withOpacity(.12), width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ===== ẢNH + BADGE =====
            Expanded(
              child: ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(20)),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFFE3F2FD),
                            Color(0xFFF9FBFF),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                    if (cover == null || cover.isEmpty)
                      const Center(
                        child: Icon(
                          Icons.image_outlined,
                          color: Colors.black26,
                          size: 40,
                        ),
                      )
                    else
                      Image.network(
                        buildImageUrl(cover),
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),

                    // badge khuyến mãi
                    if (promo != null && promo!.label.isNotEmpty)
                      Align(
                        alignment: Alignment.topLeft,
                        child: Container(
                          margin: const EdgeInsets.all(8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _primaryBlue.withOpacity(.95),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Text(
                            promo!.label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),

                    // thời gian KM
                    if (promo?.startAt != null && promo?.endAt != null)
                      Align(
                        alignment: Alignment.bottomLeft,
                        child: Container(
                          margin: const EdgeInsets.all(8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(.85),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Kết thúc sau: ${df.format(promo!.endAt!)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 9,
                              color: Color.fromARGB(221, 255, 0, 0),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // ===== THÔNG TIN =====
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hàng 1: Mã sản phẩm (trái) + Đã bán (phải)
                  // Hang 1: ma san pham (trai) + da ban (phai)
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _primaryBlue.withOpacity(.12),
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Text(
                          'Mã #${product.id}',
                          style: const TextStyle(
                            color: _primaryBlue,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          Icon(
                            Icons.check_circle_rounded,
                            size: 14,
                            color: _secondaryBlue,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Đã bán: ${stats?.sold ?? 0}',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Ten san pham
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Gia
                  Row(
                    children: [
                      if (percent != null && percent > 0) ...[
                        Text(
                          formatPrice(basePrice),
                          style: const TextStyle(
                            fontSize: 12,
                            color: _primaryBlue,
                            decoration: TextDecoration.lineThrough,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          formatPrice(finalPrice),
                          style: const TextStyle(
                            color: Colors.red,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ] else ...[
                        Text(
                          formatPrice(basePrice),
                          style: const TextStyle(
                            fontSize: 14,
                            color: _primaryBlue,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  late final ProductService _productService;

  List<Product> _products = [];
  bool _loadingProduct = true;
  String? _errProduct;

  // filter
  String _filterCategoryName = '';
  double? _filterMinPrice;
  double? _filterMaxPrice;
  bool _showFilters = false;

  // controllers filter
  final _categoryController = TextEditingController();
  final _minPriceController = TextEditingController();
  final _maxPriceController = TextEditingController();

  // paging
  static const int _pageSize = 10;
  int _productPage = 0;
  bool _hasNextPage = false;
  int? _totalPages;

  // stats & promotion cache
  final Map<int, ProductStats> _statsMap = {};
  final Map<int, ProductPromotionInfo> _promoMap = {};

  String _buildStoragePublicUrl(String p) => p.startsWith('http')
      ? p
      : 'https://ergnrfsqzghjseovmzkg.supabase.co/storage/v1/object/public/$p';

  @override
  void initState() {
    super.initState();
    final api = ApiClient();
    _productService = ProductService(api);
    _loadProducts(page: 0);
  }

  @override
  void dispose() {
    _categoryController.dispose();
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts({required int page}) async {
    setState(() {
      _loadingProduct = true;
      _errProduct = null;
    });

    try {
      // tổng trang
      if (_totalPages == null) {
        final api = ApiClient();
        final res = await api.get('/sanpham/count', queryParameters: {
          if (_filterCategoryName.isNotEmpty)
            'categoryName': _filterCategoryName,
          if (_filterMinPrice != null) 'minPrice': _filterMinPrice!.toString(),
          if (_filterMaxPrice != null) 'maxPrice': _filterMaxPrice!.toString(),
        });

        final total = (res['total'] ?? res['count'] ?? 0) as int;
        _totalPages = total > 0 ? (total / _pageSize).ceil() : 1;
      }

      final offset = page * _pageSize;

      final products = await _productService.listWithImages(
        limit: _pageSize + 1,
        offset: offset,
        categoryName:
            _filterCategoryName.isNotEmpty ? _filterCategoryName : null,
        minPrice: _filterMinPrice,
        maxPrice: _filterMaxPrice,
        forceCatalog: _filterCategoryName.isNotEmpty ||
            _filterMinPrice != null ||
            _filterMaxPrice != null,
      );

      final hasNext = products.length > _pageSize;
      final sliced = hasNext
          ? products.sublist(0, _pageSize)
          : List<Product>.from(products);

      setState(() {
        _products = sliced;
        _productPage = page;
        _hasNextPage = hasNext;
      });

      await Future.wait([
        _loadStatsForCurrentProducts(),
        _loadPromotionsForCurrentProducts(),
      ]);

      setState(() {
        _products.sort((a, b) {
          final promoA = _promoMap.containsKey(a.id);
          final promoB = _promoMap.containsKey(b.id);
          if (promoA == promoB) return 0;
          return promoA ? -1 : 1;
        });
      });
    } catch (e) {
      setState(() {
        _errProduct = e.toString();
      });
    } finally {
      setState(() {
        _loadingProduct = false;
      });
    }
  }

  Future<void> _loadStatsForCurrentProducts() async {
    final ids = _products.map((e) => e.id).toList();
    if (ids.isEmpty) return;

    try {
      final statsMap = await _productService.productsStats(ids);
      statsMap.forEach((key, value) {
        _statsMap[key] = value;
      });
      setState(() {});
    } catch (_) {}
  }

  Future<void> _loadPromotionsForCurrentProducts() async {
    final ids = _products.map((e) => e.id).toList();
    if (ids.isEmpty) return;

    try {
      final api = ApiClient();
      final res = await api.get('/khuyenmai', headers: {
        'Content-Type': 'application/json',
      });

      dynamic body = res['data'] ?? res['items'] ?? res;
      if (body is! List) return;
      final list = body.cast<Map<String, dynamic>>();

      final Map<int, ProductPromotionInfo> promoMap = {};
      final now = vietnamNow();

      for (final j in list) {
        final info = ProductPromotionInfo.fromJson(j);

        bool active = true;
        final start = info.startAt;
        final end = info.endAt;
        if (start != null && now.isBefore(start)) active = false;
        if (end != null && now.isAfter(end)) active = false;

        final status =
            (j['trangthai'] ?? j['trangThai'] ?? '').toString().toLowerCase();
        if (status.isNotEmpty &&
            !status.contains('dang') &&
            !status.contains('đang')) {
          active = false;
        }

        if (!active) continue;

        final productIds = <int>{};

        final rawApply =
            j['sanpham_apdung_ids'] ?? j['sanPhamApDungIds'] ?? j['sanphamIds'];
        if (rawApply is List) {
          for (final v in rawApply) {
            final id = int.tryParse(v.toString());
            if (id != null) productIds.add(id);
          }
        } else if (rawApply is String) {
          final matches = RegExp(r'\d+').allMatches(rawApply);
          for (final m in matches) {
            final id = int.tryParse(m.group(0)!);
            if (id != null) productIds.add(id);
          }
        }

        final singleId = j['masanpham'];
        if (singleId != null) {
          final id = int.tryParse(singleId.toString());
          if (id != null) productIds.add(id);
        }

        if (productIds.isEmpty) continue;

        for (final pid in productIds) {
          if (ids.contains(pid)) {
            promoMap[pid] = info;
          }
        }
      }

      setState(() {
        _promoMap
          ..clear()
          ..addAll(promoMap);
        _products.sort((a, b) {
          final hasPromoA = _promoMap.containsKey(a.id);
          final hasPromoB = _promoMap.containsKey(b.id);
          if (hasPromoA == hasPromoB) return 0;
          return hasPromoA ? -1 : 1;
        });
      });
    } catch (_) {}
  }

  void _applyFilters() {
    final min = double.tryParse(_minPriceController.text.replaceAll('.', ''));
    final max = double.tryParse(_maxPriceController.text.replaceAll('.', ''));

    if (min != null && max != null && min > max) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Giá từ không được lớn hơn giá đến'),
        ),
      );
      return;
    }

    setState(() {
      _filterCategoryName = _categoryController.text.trim();
      _filterMinPrice = min;
      _filterMaxPrice = max;
      _totalPages = null;
    });
    _loadProducts(page: 0);
  }

  void _clearFilters() {
    _categoryController.clear();
    _minPriceController.clear();
    _maxPriceController.clear();
    setState(() {
      _filterCategoryName = '';
      _filterMinPrice = null;
      _filterMaxPrice = null;
      _totalPages = null;
    });
    _loadProducts(page: 0);
  }

  void _nextProductPage() {
    if (_hasNextPage) _loadProducts(page: _productPage + 1);
  }

  void _prevProductPage() {
    if (_productPage > 0) _loadProducts(page: _productPage - 1);
  }

  void _jumpToPage(int page) {
    if (page <= 0) return;
    final maxPage = (_totalPages ?? 1);
    final p = page > maxPage ? maxPage : page;
    _loadProducts(page: p - 1);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _backgroundBlue,
      appBar: AppBar(
        backgroundColor: _primaryBlue,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Sản phẩm',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _showFilters ? Icons.filter_alt : Icons.filter_alt_outlined,
            ),
            onPressed: () => setState(() => _showFilters = !_showFilters),
            tooltip: 'Bộ lọc',
          ),
        ],
      ),
      body: Column(
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.shopping_bag_outlined,
                  color: _primaryBlue,
                  size: 22,
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Bộ sưu tập ELORA',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (_products.isNotEmpty)
                  Text(
                    '${_products.length} mẫu',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
              ],
            ),
          ),

          // Panel filter
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 220),
            crossFadeState: _showFilters
                ? CrossFadeState.showFirst
                : CrossFadeState.showSecond,
            firstChild: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Card(
                color: Colors.white,
                elevation: 1,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: _primaryBlue.withOpacity(0.15),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Bộ lọc',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _categoryController,
                        decoration: const InputDecoration(
                          labelText: 'Tên danh mục (tạm lọc theo tên SP)',
                          border: OutlineInputBorder(),
                          isDense: true,
                          prefixIcon: Icon(Icons.category_outlined),
                        ),
                        onSubmitted: (_) => _applyFilters(),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _minPriceController,
                              decoration: const InputDecoration(
                                labelText: 'Giá từ',
                                border: OutlineInputBorder(),
                                isDense: true,
                                prefixIcon: Icon(Icons.attach_money),
                              ),
                              keyboardType: TextInputType.number,
                              onSubmitted: (_) => _applyFilters(),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextField(
                              controller: _maxPriceController,
                              decoration: const InputDecoration(
                                labelText: 'Giá đến',
                                border: OutlineInputBorder(),
                                isDense: true,
                                prefixIcon: Icon(Icons.attach_money),
                              ),
                              keyboardType: TextInputType.number,
                              onSubmitted: (_) => _applyFilters(),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          TextButton.icon(
                            onPressed: _clearFilters,
                            icon: const Icon(Icons.refresh),
                            label: const Text('Xóa lọc'),
                          ),
                          const Spacer(),
                          FilledButton.icon(
                            onPressed: _applyFilters,
                            icon: const Icon(Icons.check),
                            label: const Text('Áp dụng'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            secondChild: const SizedBox.shrink(),
          ),

          // Thông tin trang
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
            child: Row(
              children: [
                Text(
                  'Trang ${_productPage + 1}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                const Spacer(),
                if (_products.isNotEmpty)
                  Text(
                    '#${_products.first.id} · Đã bán: ${_statsMap[_products.first.id]?.sold ?? 0}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Colors.grey,
                    ),
                  ),
              ],
            ),
          ),

          // Nội dung
          Expanded(
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: _loadingProduct
                  ? const Center(child: CircularProgressIndicator())
                  : (_errProduct != null)
                      ? _buildErrorState()
                      : (_products.isEmpty)
                          ? _buildEmptyState()
                          : Column(
                              children: [
                                Expanded(
                                  child: RefreshIndicator(
                                    onRefresh: () =>
                                        _loadProducts(page: _productPage),
                                    child: GridView.builder(
                                      padding: const EdgeInsets.fromLTRB(
                                          12, 8, 12, 12),
                                      gridDelegate:
                                          const SliverGridDelegateWithFixedCrossAxisCount(
                                        crossAxisCount: 2,
                                        childAspectRatio: .68,
                                        crossAxisSpacing: 8,
                                        mainAxisSpacing: 8,
                                      ),
                                      itemCount: _products.length,
                                      itemBuilder: (context, i) {
                                        final p = _products[i];
                                        final stats = _statsMap[p.id];
                                        final promo = _promoMap[p.id];
                                        return _ProductCard(
                                          product: p,
                                          buildImageUrl: _buildStoragePublicUrl,
                                          stats: stats,
                                          promo: promo,
                                          onTap: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute(
                                                builder: (_) =>
                                                    ProductDetailScreen(
                                                  product: p,
                                                  buildImageUrl:
                                                      _buildStoragePublicUrl,
                                                ),
                                              ),
                                            );
                                          },
                                        );
                                      },
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 8),
                                  child: _PaginationBar(
                                    currentPage: _productPage + 1,
                                    totalPages: _totalPages,
                                    hasNext: _hasNextPage,
                                    onPrev: _prevProductPage,
                                    onNext: _nextProductPage,
                                    onJump: _jumpToPage,
                                  ),
                                ),
                              ],
                            ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            const Text(
              'Không thể tải sản phẩm',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errProduct ?? '',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.black54,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => _loadProducts(page: 0),
              icon: const Icon(Icons.refresh),
              label: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.shopping_basket_outlined,
            size: 72,
            color: Colors.black26,
          ),
          SizedBox(height: 8),
          Text(
            'Không có sản phẩm',
            style: TextStyle(
              color: Colors.black54,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}

// ================= PaginationBar =================

class _PaginationBar extends StatefulWidget {
  final int currentPage;
  final int? totalPages;
  final bool hasNext;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final void Function(int page) onJump;

  const _PaginationBar({
    required this.currentPage,
    required this.totalPages,
    required this.hasNext,
    required this.onPrev,
    required this.onNext,
    required this.onJump,
  });

  @override
  State<_PaginationBar> createState() => _PaginationBarState();
}

class _PaginationBarState extends State<_PaginationBar> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final total = widget.totalPages;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          TextButton.icon(
            onPressed: widget.currentPage > 1 ? widget.onPrev : null,
            icon: const Icon(Icons.chevron_left),
            label: const Text('Trước'),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 40,
                  child: TextField(
                    controller: _ctrl,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13),
                    decoration: const InputDecoration(
                      isDense: true,
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                      border: InputBorder.none,
                    ),
                    onSubmitted: (v) {
                      final n = int.tryParse(v.trim());
                      if (n == null || n <= 0) return;
                      widget.onJump(n);
                      _ctrl.clear();
                    },
                  ),
                ),
                if (total != null)
                  Text(
                    '/ $total',
                    style: const TextStyle(fontSize: 13),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          TextButton.icon(
            onPressed: widget.hasNext ? widget.onNext : null,
            label: const Text('Tiếp'),
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }
}
