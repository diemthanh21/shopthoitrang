import 'package:flutter/material.dart';
import '../services/product_service.dart';
import '../services/api_client.dart';
import '../models/product_model.dart';
import '../widgets/product_gallery_card.dart';
import 'product_detail_screen.dart';

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

  // Bộ lọc
  String _filterCategoryName = '';
  double? _filterMinPrice;
  double? _filterMaxPrice;
  bool _filterOnlyFiveStar = false;
  bool _showFilters = false;

  // Controllers cho text fields
  final _categoryController = TextEditingController();
  final _minPriceController = TextEditingController();
  final _maxPriceController = TextEditingController();

  // Pagination
  static const int _pageSize = 10;
  int _productPage = 0;
  bool _hasNextPage = false;
  int? _totalPages;

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
    try {
      setState(() {
        _loadingProduct = true;
        _errProduct = null;
      });

      if (_totalPages == null) {
        try {
          final totalItems = await _productService.countProducts(
            categoryName:
                _filterCategoryName.isNotEmpty ? _filterCategoryName : null,
            minPrice: _filterMinPrice,
            maxPrice: _filterMaxPrice,
            onlyFiveStar: _filterOnlyFiveStar,
          );
          if (mounted && totalItems > 0) {
            _totalPages = (totalItems / _pageSize).ceil();
          }
        } catch (_) {}
      }

      final offset = page * _pageSize;
      final data = await _productService.listWithImages(
        limit: _pageSize + 1,
        offset: offset,
        categoryName:
            _filterCategoryName.isNotEmpty ? _filterCategoryName : null,
        minPrice: _filterMinPrice,
        maxPrice: _filterMaxPrice,
        onlyFiveStar: _filterOnlyFiveStar,
        forceCatalog: _filterCategoryName.isNotEmpty ||
            _filterMinPrice != null ||
            _filterMaxPrice != null ||
            _filterOnlyFiveStar,
      );

      if (!mounted) return;
      setState(() {
        _hasNextPage = data.length > _pageSize;
        _products = _hasNextPage ? data.take(_pageSize).toList() : data;
        _productPage = page;
        _loadingProduct = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errProduct = e.toString().contains('401')
            ? 'Bạn cần đăng nhập để xem sản phẩm'
            : e.toString();
        _loadingProduct = false;
      });
    }
  }

  void _prevProductPage() {
    if (_productPage <= 0 || _loadingProduct) return;
    _loadProducts(page: _productPage - 1);
  }

  void _nextProductPage() {
    if (_loadingProduct) return;
    if (_totalPages != null) {
      if (_productPage + 1 >= _totalPages!) return;
      _loadProducts(page: _productPage + 1);
    } else {
      if (_hasNextPage) _loadProducts(page: _productPage + 1);
    }
  }

  void _jumpToPage(int page1Based) {
    if (_loadingProduct) return;
    int p = page1Based;
    if (p < 1) p = 1;
    if (_totalPages != null && p > _totalPages!) p = _totalPages!;
    _loadProducts(page: p - 1);
  }

  void _applyFilters() {
    setState(() {
      _filterCategoryName = _categoryController.text.trim();
      _filterMinPrice = double.tryParse(_minPriceController.text.trim());
      _filterMaxPrice = double.tryParse(_maxPriceController.text.trim());
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
      _filterOnlyFiveStar = false;
      _totalPages = null;
    });
    _loadProducts(page: 0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sản phẩm'),
        elevation: 0.5,
        actions: [
          IconButton(
            icon: Icon(
                _showFilters ? Icons.filter_alt : Icons.filter_alt_outlined),
            onPressed: () => setState(() => _showFilters = !_showFilters),
            tooltip: 'Bộ lọc',
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter section
          if (_showFilters)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Bộ lọc và sắp xếp',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _categoryController,
                    decoration: const InputDecoration(
                      labelText: 'Tên danh mục',
                      border: OutlineInputBorder(),
                      isDense: true,
                      prefixIcon: Icon(Icons.category),
                    ),
                    onSubmitted: (_) => _applyFilters(),
                  ),
                  const SizedBox(height: 12),
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
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      FilterChip(
                        selected: _filterOnlyFiveStar,
                        onSelected: (s) {
                          setState(() {
                            _filterOnlyFiveStar = s;
                            _totalPages = null;
                          });
                          _loadProducts(page: 0);
                        },
                        label: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.star, size: 16, color: Colors.amber),
                            SizedBox(width: 4),
                            Text('5 sao'),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton.icon(
                              onPressed: _clearFilters,
                              icon: const Icon(Icons.clear, size: 18),
                              label: const Text('Xóa'),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton.icon(
                              onPressed: _applyFilters,
                              icon: const Icon(Icons.search, size: 18),
                              label: const Text('Áp dụng'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

          // Page info
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Text(
                  'Trang ${_productPage + 1}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                const Spacer(),
                if (_totalPages != null)
                  Text(
                    'Tổng: $_totalPages trang',
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
              ],
            ),
          ),

          // Products grid
          Expanded(
            child: _loadingProduct
                ? const Center(child: CircularProgressIndicator())
                : (_errProduct != null)
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.error_outline,
                                  size: 60, color: Colors.red[300]),
                              const SizedBox(height: 16),
                              Text(
                                'Lỗi tải sản phẩm',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey[700],
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _errProduct!,
                                style: TextStyle(color: Colors.grey[600]),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                onPressed: () => _loadProducts(page: 0),
                                icon: const Icon(Icons.refresh),
                                label: const Text('Thử lại'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : (_products.isEmpty)
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.shopping_bag_outlined,
                                    size: 80, color: Colors.grey[400]),
                                const SizedBox(height: 16),
                                Text(
                                  'Không có sản phẩm',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _loadProducts(page: _productPage),
                            child: GridView.builder(
                              padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: .68,
                                crossAxisSpacing: 8,
                                mainAxisSpacing: 8,
                              ),
                              itemCount: _products.length,
                              itemBuilder: (context, i) => ProductGalleryCard(
                                product: _products[i],
                                buildImageUrl: _buildStoragePublicUrl,
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => ProductDetailScreen(
                                        product: _products[i],
                                        buildImageUrl: _buildStoragePublicUrl,
                                      ),
                                    ),
                                  );
                                },
                                autoPlay: false,
                              ),
                            ),
                          ),
          ),

          // Pagination bar
          Container(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey[300]!)),
            ),
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
    );
  }
}

// ================= PaginationBar (riêng cho ProductListScreen) =================

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

  List<int> _pagesToShow(int cur, int total) {
    final set = <int>{1, total, cur};
    if (cur - 1 >= 1) set.add(cur - 1);
    if (cur + 1 <= total) set.add(cur + 1);
    final list = set.toList()..sort();
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final cur = widget.currentPage;
    final total = widget.totalPages;

    final canPrev = cur > 1;
    final canNext = total != null ? (cur < total) : widget.hasNext;

    Widget pill(int page, {bool active = false}) {
      return InkWell(
        onTap: active ? null : () => widget.onJump(page),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: active
                ? Theme.of(context).colorScheme.primary.withOpacity(.12)
                : Colors.white,
            border: Border.all(
              color: active
                  ? Theme.of(context).colorScheme.primary
                  : Colors.grey.shade300,
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            '$page',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: active
                  ? Theme.of(context).colorScheme.primary
                  : Colors.black87,
            ),
          ),
        ),
      );
    }

    final children = <Widget>[
      IconButton(
        icon: const Icon(Icons.chevron_left, size: 20),
        onPressed: canPrev ? widget.onPrev : null,
        tooltip: 'Trang trước',
        padding: const EdgeInsets.all(8),
        constraints: const BoxConstraints(),
      ),
    ];

    if (total != null && total > 0) {
      final show = _pagesToShow(cur, total);
      for (var i = 0; i < show.length; i++) {
        final p = show[i];
        final prev = i > 0 ? show[i - 1] : null;
        if (prev != null && p - prev > 1) {
          children.add(const Padding(
            padding: EdgeInsets.symmetric(horizontal: 4),
            child:
                Text('…', style: TextStyle(fontSize: 14, color: Colors.grey)),
          ));
        }
        children.add(pill(p, active: p == cur));
        if (i < show.length - 1) children.add(const SizedBox(width: 4));
      }
    } else {
      children.add(pill(cur, active: true));
    }

    children.add(
      IconButton(
        icon: const Icon(Icons.chevron_right, size: 20),
        onPressed: canNext ? widget.onNext : null,
        tooltip: 'Trang sau',
        padding: const EdgeInsets.all(8),
        constraints: const BoxConstraints(),
      ),
    );

    // Ô nhập số trang (compact cho mobile)
    children.add(const SizedBox(width: 8));
    children.add(
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
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
                '/$total',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
              ),
            const SizedBox(width: 4),
            InkWell(
              onTap: () {
                final n = int.tryParse(_ctrl.text.trim());
                if (n == null || n <= 0) return;
                widget.onJump(n);
                _ctrl.clear();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'Đến',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(children: children),
    );
  }
}
