import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shopthoitrang_mobile/widgets/product_gallery_card.dart';

import '../services/banner_service.dart';
import '../services/product_service.dart';
import '../services/cart_service.dart';
import '../models/banner_model.dart';
import '../models/product_model.dart';
import '../services/api_client.dart';
import 'product_detail_screen.dart';
import 'profile_screen.dart';
import 'cart_screen.dart';

// ================================================================================

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;
  final CartService _cartService = CartService();
  int _cartItemCount = 0;

  @override
  void initState() {
    super.initState();
    _loadCartCount();
  }

  Future<void> _loadCartCount() async {
    try {
      final cart = await _cartService.getCart();
      if (mounted) {
        setState(() {
          _cartItemCount = cart.itemCount;
        });
      }
    } catch (e) {
      debugPrint('Error loading cart count: $e');
    }
  }

  void _navigateToCart() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const CartScreen()),
    ).then((_) => _loadCartCount());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.4,
        centerTitle: false,
        titleSpacing: 12,
        title: Row(
          children: const [
            Icon(Icons.verified, color: Colors.blueAccent),
            SizedBox(width: 8),
            Text(
              'ELORA',
              style: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.w700,
                letterSpacing: .5,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_bag_outlined),
                onPressed: _navigateToCart,
              ),
              if (_cartItemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      _cartItemCount > 99 ? '99+' : '$_cartItemCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          _HomeTab(),
          _SaleTab(),
          _MenuTab(),
          _CartTab(),
          ProfileScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.black87,
        unselectedItemColor: Colors.black54,
        showUnselectedLabels: true,
        items: const [
          BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined), label: 'Trang chủ'),
          BottomNavigationBarItem(
              icon: Icon(Icons.local_offer_outlined), label: 'Sale'),
          BottomNavigationBarItem(icon: Icon(Icons.menu), label: 'Menu'),
          BottomNavigationBarItem(
              icon: Icon(Icons.shopping_cart_outlined), label: 'Giỏ'),
          BottomNavigationBarItem(
              icon: Icon(Icons.person_outline), label: 'Tài khoản'),
        ],
      ),
    );
  }
}

/// ====== TAB TRANG CHỦ ======
class _HomeTab extends StatefulWidget {
  const _HomeTab();

  @override
  State<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<_HomeTab> {
  final _pageCtrl = PageController();
  int _page = 0;

  late final BannerService _bannerService;
  late final ProductService _productService;

  List<BannerModel> _banners = [];
  List<Product> _products = [];

  bool _loadingBanner = true;
  bool _loadingProduct = true;
  String? _errBanner;
  String? _errProduct;
  // Bộ lọc
  String _filterCategoryName = '';
  double? _filterMinPrice;
  double? _filterMaxPrice;
  bool _filterOnlyFiveStar = false;
  bool _showFilters = false;

  // Pagination cho sản phẩm
  static const int _pageSize = 2;
  int _productPage = 0; // 0-based
  bool _hasNextPage = false; // true nếu trả về đủ _pageSize
  int? _totalPages; // tổng số trang (có nếu backend có /count)

  // Nếu bạn lưu path tương đối của ảnh trong Supabase Storage:
  static const _supabaseProjectRef = 'ergnrfsqzghjseovmzkg';
  String _buildStoragePublicUrl(String p) => p.startsWith('http')
      ? p
      : 'https://$_supabaseProjectRef.supabase.co/storage/v1/object/public/$p';

  @override
  void initState() {
    super.initState();
    final api = ApiClient();
    _bannerService = BannerService(api);
    _productService = ProductService(api);
    _loadBanners();
    _loadProducts(page: 0);
  }

  Future<void> _loadBanners() async {
    try {
      final data = await _bannerService.list(active: true);
      if (!mounted) return;
      setState(() {
        _banners = data;
        _loadingBanner = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errBanner = e.toString();
        _loadingBanner = false;
      });
    }
  }

  Future<void> _loadProducts({required int page}) async {
    try {
      setState(() {
        _loadingProduct = true;
        _errProduct = null;
      });

      // lấy tổng trang 1 lần (nếu backend có /count)
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
        } catch (_) {
          // backend chưa có count -> bỏ qua
        }
      }

      final offset = page * _pageSize;
      // Gọi chung một chỗ qua ProductService (có forceCatalog khi có filter)
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

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        // Title
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Text(
              'Sản phẩm nổi bật',
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w800, letterSpacing: 1.2),
            ),
          ),
        ),

        // Banner slider
        SliverToBoxAdapter(
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: _loadingBanner
                    ? const Center(child: CircularProgressIndicator())
                    : (_errBanner != null)
                        ? Center(
                            child: Text(
                              _errBanner!,
                              style: const TextStyle(color: Colors.red),
                            ),
                          )
                        : (_banners.isEmpty)
                            ? Container(
                                color: Colors.grey[200],
                                child: const Center(
                                  child: Text('Không có banner'),
                                ),
                              )
                            : PageView.builder(
                                controller: _pageCtrl,
                                onPageChanged: (i) => setState(() => _page = i),
                                itemCount: _banners.length,
                                itemBuilder: (_, i) =>
                                    _BannerSlide(banner: _banners[i]),
                              ),
              ),
            ),
          ),
        ),

        // Indicator
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  splashRadius: 18,
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () {
                    if (_page > 0) {
                      _pageCtrl.previousPage(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeOut,
                      );
                    }
                  },
                ),
                Text(
                  '${_banners.isEmpty ? 0 : _page + 1}/${_banners.length}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                IconButton(
                  splashRadius: 18,
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () {
                    if (_page < _banners.length - 1) {
                      _pageCtrl.nextPage(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeOut,
                      );
                    }
                  },
                ),
              ],
            ),
          ),
        ),

        // Filter + info (hiển thị trang hiện tại)
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    TextButton.icon(
                      onPressed: () =>
                          setState(() => _showFilters = !_showFilters),
                      icon: const Icon(Icons.tune),
                      label: const Text('Lọc và sắp xếp',
                          style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                    const Spacer(),
                    Text('Trang ${_productPage + 1}',
                        style: TextStyle(
                            color: Colors.grey[700],
                            fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 8),
                if (_showFilters)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      SizedBox(
                        width: 180,
                        child: TextField(
                          decoration: const InputDecoration(
                            labelText: 'Tên danh mục',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          onSubmitted: (v) {
                            setState(() {
                              _filterCategoryName = v.trim();
                              _totalPages =
                                  null; // reset để đếm lại theo filter
                            });
                            _loadProducts(page: 0);
                          },
                        ),
                      ),
                      SizedBox(
                        width: 120,
                        child: TextField(
                          decoration: const InputDecoration(
                            labelText: 'Giá từ',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          keyboardType: TextInputType.number,
                          onSubmitted: (v) {
                            final d = double.tryParse(v);
                            setState(() {
                              _filterMinPrice = d;
                              _totalPages = null;
                            });
                            _loadProducts(page: 0);
                          },
                        ),
                      ),
                      SizedBox(
                        width: 120,
                        child: TextField(
                          decoration: const InputDecoration(
                            labelText: 'Giá đến',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          keyboardType: TextInputType.number,
                          onSubmitted: (v) {
                            final d = double.tryParse(v);
                            setState(() {
                              _filterMaxPrice = d;
                              _totalPages = null;
                            });
                            _loadProducts(page: 0);
                          },
                        ),
                      ),
                      FilterChip(
                        selected: _filterOnlyFiveStar,
                        onSelected: (s) {
                          setState(() {
                            _filterOnlyFiveStar = s;
                            _totalPages = null;
                          });
                          _loadProducts(page: 0);
                        },
                        label: const Text('5 sao'),
                      ),
                      TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _filterCategoryName = '';
                            _filterMinPrice = null;
                            _filterMaxPrice = null;
                            _filterOnlyFiveStar = false;
                            _totalPages = null;
                          });
                          _loadProducts(page: 0);
                        },
                        icon: const Icon(Icons.clear),
                        label: const Text('Xoá lọc'),
                      )
                    ],
                  ),
              ],
            ),
          ),
        ),

        // Grid sản phẩm
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
          sliver: _loadingProduct
              ? const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                )
              : (_errProduct != null)
                  ? SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          'Lỗi tải sản phẩm: $_errProduct',
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    )
                  : SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: .68,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, i) => ProductGalleryCard(
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
                        childCount: _products.length,
                      ),
                    ),
        ),

        // Pagination bar (1 2 3 … N + ô nhập)
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
            child: PaginationBar(
              currentPage: _productPage + 1,
              totalPages: _totalPages,
              hasNext: _hasNextPage,
              onPrev: _prevProductPage,
              onNext: _nextProductPage,
              onJump: _jumpToPage,
            ),
          ),
        ),
      ],
    );
  }
}

class _BannerSlide extends StatelessWidget {
  final BannerModel banner;
  const _BannerSlide({required this.banner});

  @override
  Widget build(BuildContext context) {
    final desc = banner.description;
    return Stack(
      fit: StackFit.expand,
      children: [
        Positioned.fill(
          child: banner.imageUrl.isEmpty
              ? Container(color: Colors.grey[300])
              : Image.network(
                  banner.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: Colors.grey[300],
                    child: const Icon(Icons.image_not_supported),
                  ),
                ),
        ),
        if (desc != null && desc.trim().isNotEmpty)
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [Colors.black54, Colors.transparent],
              ),
            ),
          ),
        if (desc != null && desc.trim().isNotEmpty)
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Text(
              desc,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
                height: 1.2,
              ),
            ),
          ),
      ],
    );
  }
}

/// Card sản phẩm: hover (web/desktop) tự chạy ảnh; mobile vuốt để đổi ảnh
class ProductCardHover extends StatefulWidget {
  final Product product;
  final void Function()? onTap;
  final String Function(String relativePath)? buildImageUrl;

  const ProductCardHover({
    super.key,
    required this.product,
    this.onTap,
    this.buildImageUrl,
  });

  @override
  State<ProductCardHover> createState() => _ProductCardHoverState();
}

class _ProductCardHoverState extends State<ProductCardHover> {
  int _index = 0;
  Timer? _timer;
  late final List<String> _urls;

  bool get _isWebLike =>
      kIsWeb ||
      [TargetPlatform.macOS, TargetPlatform.windows, TargetPlatform.linux]
          .contains(defaultTargetPlatform);

  @override
  void initState() {
    super.initState();
    _urls = widget.product.allImages
        .map((e) =>
            widget.buildImageUrl != null ? widget.buildImageUrl!(e.url) : e.url)
        .where((u) => u.isNotEmpty)
        .toList();
    if (_urls.isEmpty) {
      _urls.add('https://picsum.photos/seed/${widget.product.id}/600/600');
    }
  }

  void _start() {
    if (_urls.length <= 1) return;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(milliseconds: 900), (_) {
      if (!mounted) return;
      setState(() => _index = (_index + 1) % _urls.length);
    });
  }

  void _stop({bool reset = true}) {
    _timer?.cancel();
    if (reset && mounted) setState(() => _index = 0);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final url = _urls[_index];
    final price = widget.product.minPrice;

    Widget img = ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: Image.network(
          url,
          key: ValueKey(url),
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Container(
            color: Colors.grey[300],
            child: const Icon(Icons.broken_image),
          ),
        ),
      ),
    );

    // Mobile: vuốt để đổi ảnh
    if (!_isWebLike && _urls.length > 1) {
      img = GestureDetector(
        onHorizontalDragEnd: (d) {
          setState(() {
            if (d.primaryVelocity != null && d.primaryVelocity! < 0) {
              _index = (_index + 1) % _urls.length;
            } else {
              _index = (_index - 1 + _urls.length) % _urls.length;
            }
          });
        },
        child: img,
      );
    }

    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AspectRatio(aspectRatio: 1, child: img),
        const SizedBox(height: 8),
        Text(
          widget.product.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 4),
        if (price != null)
          Text(
            '${price.toStringAsFixed(0)}đ',
            style: TextStyle(color: Colors.grey[800]),
          ),
      ],
    );

    final card = InkWell(onTap: widget.onTap, child: content);

    // Web/desktop: hover để auto chạy ảnh
    if (_isWebLike) {
      return MouseRegion(
          onEnter: (_) => _start(), onExit: (_) => _stop(), child: card);
    }
    return card;
  }
}

// ====== các tab khác (placeholder) ======
class _SaleTab extends StatelessWidget {
  const _SaleTab();
  @override
  Widget build(BuildContext context) => const Center(child: Text('Sale'));
}

class _MenuTab extends StatelessWidget {
  const _MenuTab();
  @override
  Widget build(BuildContext context) => const Center(child: Text('Menu'));
}

class _CartTab extends StatelessWidget {
  const _CartTab();
  @override
  Widget build(BuildContext context) => const Center(child: Text('Giỏ hàng'));
}

// ================= PaginationBar =================

class PaginationBar extends StatefulWidget {
  final int currentPage; // 1-based
  final int? totalPages; // null => không hiện "… N"
  final bool hasNext; // dùng khi totalPages == null
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final void Function(int page) onJump;

  const PaginationBar({
    super.key,
    required this.currentPage,
    required this.totalPages,
    required this.hasNext,
    required this.onPrev,
    required this.onNext,
    required this.onJump,
  });

  @override
  State<PaginationBar> createState() => _PaginationBarState();
}

class _PaginationBarState extends State<PaginationBar> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  List<int> _pagesToShow(int cur, int total) {
    // Hiển thị: 1, [cur-1, cur, cur+1], total + chèn "…" khi cách > 1
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
        icon: const Icon(Icons.chevron_left),
        onPressed: canPrev ? widget.onPrev : null,
        tooltip: 'Trang trước',
      ),
    ];

    if (total != null && total > 0) {
      final show = _pagesToShow(cur, total);
      for (var i = 0; i < show.length; i++) {
        final p = show[i];
        final prev = i > 0 ? show[i - 1] : null;
        if (prev != null && p - prev > 1) {
          children.add(const Padding(
            padding: EdgeInsets.symmetric(horizontal: 6),
            child:
                Text('…', style: TextStyle(fontSize: 16, color: Colors.grey)),
          ));
        }
        children.add(pill(p, active: p == cur));
      }
    } else {
      // chưa biết tổng trang: chỉ hiện trang hiện tại
      children.add(pill(cur, active: true));
    }

    children.add(
      IconButton(
        icon: const Icon(Icons.chevron_right),
        onPressed: canNext ? widget.onNext : null,
        tooltip: 'Trang sau',
      ),
    );

    // Ô nhập số trang
    children.add(const SizedBox(width: 12));
    children.add(
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 56,
              child: TextField(
                controller: _ctrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  isDense: true,
                  hintText: 'Trang',
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
            Text(
              total != null ? '/ $total' : '',
              style: TextStyle(color: Colors.grey.shade700),
            ),
            const SizedBox(width: 6),
            ElevatedButton(
              onPressed: () {
                final n = int.tryParse(_ctrl.text.trim());
                if (n == null || n <= 0) return;
                widget.onJump(n);
                _ctrl.clear();
              },
              style: ElevatedButton.styleFrom(
                elevation: 0,
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Đến'),
            )
          ],
        ),
      ),
    );

    return Center(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(children: children),
      ),
    );
  }
}
