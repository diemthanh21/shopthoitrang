import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product_model.dart';
import '../services/api_client.dart';
import '../services/product_service.dart';
import '../services/order_service.dart';
import '../services/rating_service.dart';
import '../models/rating_model.dart';
import '../services/cart_service.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'cart_screen.dart';
import 'checkout_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  final String Function(String)? buildImageUrl;

  const ProductDetailScreen({
    super.key,
    required this.product,
    this.buildImageUrl,
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late PageController _pageController;
  int _currentImageIndex = 0;
  int _quantity = 1;
  ProductVariant? _selectedVariant;
  Product? _fullProduct;
  String? _selectedSize;
  // Ratings / reviews
  List<Rating> _ratings = [];
  double? _avgRating;
  bool _loadingRatings = false;
  bool _canRate = false;

  // "Có thể bạn sẽ thích" products
  List<Product> _youMayLike = [];
  bool _loadingYouMayLike = false;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _fullProduct = widget.product;
    if (_fullProduct!.variants.isNotEmpty) {
      _selectedVariant = _fullProduct!.variants.first;
      _selectedSize = _selectedVariant!.size;
    }
    _loadFullProductDetails();
    _loadRatings();
    _loadYouMayLike();
  }

  Future<void> _loadFullProductDetails() async {
    try {
      final api = ApiClient();
      final service = ProductService(api);
      // nếu API cần token, đừng quên set:
      // service.setToken(yourAuthToken);

      final p = await service.getByIdWithImages(widget.product.id);
      if (p != null && mounted) {
        setState(() {
          _fullProduct = p;
          if (_selectedVariant == null && _fullProduct!.variants.isNotEmpty) {
            _selectedVariant = _fullProduct!.variants.first;
            _selectedSize = _selectedVariant!.size;
          }
        });
      }
    } catch (e) {
      debugPrint('Error loading full product: $e');
    }
  }

  Future<void> _loadRatings() async {
    setState(() => _loadingRatings = true);
    try {
      final svc = RatingService();
      final list = await svc.listByProduct(widget.product.id);
      final avg = list.isEmpty
          ? null
          : (list.map((r) => r.score).reduce((a, b) => a + b) / list.length);
      setState(() {
        _ratings = list;
        _avgRating = avg;
      });
      await _checkCanRate();
    } catch (e) {
      debugPrint('Error loading ratings: $e');
    } finally {
      if (mounted) setState(() => _loadingRatings = false);
    }
  }

  Future<void> _checkCanRate() async {
    // User can rate if they have at least one completed order that contains one of this product's variants
    try {
      final auth = context.read<AuthProvider>();
      if (!auth.isAuthenticated || auth.user == null) {
        setState(() => _canRate = false);
        return;
      }

      final orderSvc = OrderService();
      final orders = await orderSvc.getMyOrders();
      final variantIds = (_fullProduct?.variants ?? widget.product.variants)
          .map((v) => v.id)
          .toSet();
      bool ok = false;
      for (final o in orders) {
        final status = o.orderStatus.toString().toLowerCase();
        if (status.contains('hoan') ||
            status.contains('complete') ||
            status.contains('đã ho') ||
            status.contains('hoàn')) {
          for (final it in o.items) {
            if (variantIds.contains(it.variantId)) {
              ok = true;
              break;
            }
          }
        }
        if (ok) break;
      }
      if (mounted) setState(() => _canRate = ok);
    } catch (e) {
      debugPrint('Error checking canRate: $e');
    }
  }

  Future<void> _showRatingDialog() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.user == null) {
      final goLogin = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Cần đăng nhập'),
          content: const Text('Bạn cần đăng nhập để đánh giá sản phẩm.'),
          actions: [
            TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Để sau')),
            ElevatedButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('Đăng nhập')),
          ],
        ),
      );
      if (goLogin == true) {
        if (!mounted) return;
        await Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => const LoginScreen()));
      }
      return;
    }

    int selected = 5;
    final commentCtrl = TextEditingController();
    final res = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đánh giá sản phẩm'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                  5,
                  (i) => IconButton(
                        icon: Icon(
                            i < selected ? Icons.star : Icons.star_border,
                            color: Colors.orange),
                        onPressed: () {
                          selected = i + 1;
                          (ctx as Element).markNeedsBuild();
                        },
                      )),
            ),
            TextField(
              controller: commentCtrl,
              decoration: const InputDecoration(
                  hintText: 'Ghi thêm nhận xét (tùy chọn)'),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Hủy')),
          ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Gửi')),
        ],
      ),
    );

    if (res == true) {
      final ratingSvc = RatingService();
      final ok = await ratingSvc.create(
        productId: widget.product.id,
        variantId: _selectedVariant?.id,
        customerId: auth.user!.maKhachHang,
        score: selected,
        comment: commentCtrl.text.isNotEmpty ? commentCtrl.text : null,
      );
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Cảm ơn bạn đã đánh giá'),
            backgroundColor: Colors.green));
        await _loadRatings();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(ratingSvc.lastError ?? 'Không thể gửi đánh giá'),
            backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _loadYouMayLike() async {
    setState(() => _loadingYouMayLike = true);
    try {
      final api = ApiClient();
      final svc = ProductService(api);
      final list =
          await svc.listWithImages(limit: 6, orderBy: 'rating', sortDesc: true);
      if (mounted) setState(() => _youMayLike = list);
    } catch (e) {
      debugPrint('Error loading recommended: $e');
    } finally {
      if (mounted) setState(() => _loadingYouMayLike = false);
    }
  }

  Future<void> _addToCart() async {
    if (_selectedVariant == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn phiên bản sản phẩm')),
      );
      return;
    }

    try {
      // Require login before adding to cart
      final authed = context.read<AuthProvider>().isAuthenticated;
      if (!authed) {
        final goLogin = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Cần đăng nhập'),
            content: const Text('Bạn cần đăng nhập để thêm vào giỏ hàng.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Để sau'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('Đăng nhập'),
              ),
            ],
          ),
        );
        if (goLogin == true) {
          if (!mounted) return;
          await Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const LoginScreen()),
          );
        }
        return;
      }

      final cartService = CartService();
      final success = await cartService.addToCart(
        variantId: _selectedVariant!.id,
        price: _selectedVariant!.price,
        quantity: _quantity,
      );

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Đã thêm vào giỏ hàng'),
          backgroundColor: Colors.green,
          duration: Duration(milliseconds: 1200),
        ));
        // Điều hướng sang Giỏ hàng để user thấy ngay
        if (!mounted) return;
        await Future.delayed(const Duration(milliseconds: 200));
        if (!mounted) return;
        // ignore: use_build_context_synchronously
        await Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const CartScreen()),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text(cartService.lastError ?? 'Không thể thêm vào giỏ hàng'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      debugPrint('Error adding to cart: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // Show bottom sheet for variant selection when adding to cart
  void _showAddToCartVariantSelector() {
    final product = _fullProduct ?? widget.product;
    ProductVariant? tempSelectedVariant = _selectedVariant;
    String? tempSelectedSize = _selectedSize;
    int tempQuantity = _quantity;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.75,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: Colors.grey[200]!),
                    ),
                  ),
                  child: Row(
                    children: [
                      // Product image
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(7),
                          child: tempSelectedVariant?.images.isNotEmpty == true
                              ? Image.network(
                                  _buildImageUrl(
                                      tempSelectedVariant!.images.first.url),
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      Container(color: Colors.grey[200]),
                                )
                              : product.variants.isNotEmpty &&
                                      product.variants.first.images.isNotEmpty
                                  ? Image.network(
                                      _buildImageUrl(product
                                          .variants.first.images.first.url),
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) =>
                                          Container(color: Colors.grey[200]),
                                    )
                                  : Container(color: Colors.grey[200]),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Price and close button
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${tempSelectedVariant?.price.toStringAsFixed(0) ?? (product.variants.isNotEmpty ? product.variants.first.price.toStringAsFixed(0) : "0")}đ',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.red,
                              ),
                            ),
                            if (tempSelectedVariant != null)
                              Text(
                                'Màu: ${tempSelectedVariant?.color ?? "N/A"} | Size: ${tempSelectedSize ?? "N/A"}',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey[600],
                                ),
                              ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
                // Content - same as buy now selector
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Color selection
                        const Text(
                          'Chọn màu',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 140,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: product.variants.length,
                            itemBuilder: (_, i) {
                              final v = product.variants[i];
                              final isSelected =
                                  tempSelectedVariant?.id == v.id;
                              final isOutOfStock = v.stock <= 0;
                              final img = v.images.isNotEmpty
                                  ? v.images.first.url
                                  : (product.variants.isNotEmpty &&
                                          product
                                              .variants.first.images.isNotEmpty
                                      ? product.variants.first.images.first.url
                                      : '');
                              return GestureDetector(
                                onTap: isOutOfStock
                                    ? null
                                    : () {
                                        setModalState(() {
                                          tempSelectedVariant = v;
                                          tempSelectedSize = v.size;
                                        });
                                      },
                                child: Opacity(
                                  opacity: isOutOfStock ? 0.5 : 1.0,
                                  child: Stack(
                                    children: [
                                      Container(
                                        width: 80,
                                        margin:
                                            const EdgeInsets.only(right: 12),
                                        decoration: BoxDecoration(
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          border: Border.all(
                                            color: isSelected
                                                ? Colors.black
                                                : Colors.grey[300]!,
                                            width: isSelected ? 2 : 1,
                                          ),
                                        ),
                                        child: Column(
                                          children: [
                                            Expanded(
                                              child: ClipRRect(
                                                borderRadius:
                                                    const BorderRadius.vertical(
                                                  top: Radius.circular(7),
                                                ),
                                                child: img.isNotEmpty
                                                    ? Image.network(
                                                        _buildImageUrl(img),
                                                        fit: BoxFit.cover,
                                                        width: double.infinity,
                                                        errorBuilder: (_, __,
                                                                ___) =>
                                                            Container(
                                                                color: Colors
                                                                    .grey[200]),
                                                      )
                                                    : Container(
                                                        color:
                                                            Colors.grey[200]),
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.all(4),
                                              child: Text(
                                                v.color ?? v.displayName,
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: isOutOfStock
                                                      ? Colors.grey
                                                      : Colors.black,
                                                ),
                                                textAlign: TextAlign.center,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      if (isOutOfStock)
                                        Positioned.fill(
                                          child: Container(
                                            decoration: BoxDecoration(
                                              color:
                                                  Colors.black.withOpacity(0.3),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            child: const Center(
                                              child: Text(
                                                'Hết hàng',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Size selection
                        const Text(
                          'Chọn size',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: product.variants
                              .where((v) =>
                                  tempSelectedVariant == null ||
                                  v.color == tempSelectedVariant?.color)
                              .map((v) => v.size)
                              .where((s) => s != null && s.isNotEmpty)
                              .toSet()
                              .map((size) {
                            final isSelected = tempSelectedSize == size;
                            final matchingVariant = product.variants
                                .where((v) =>
                                    v.size == size &&
                                    (tempSelectedVariant == null ||
                                        v.color == tempSelectedVariant?.color))
                                .firstOrNull;
                            final isOutOfStock = matchingVariant != null &&
                                matchingVariant.stock <= 0;
                            return GestureDetector(
                              onTap: isOutOfStock
                                  ? null
                                  : () {
                                      setModalState(() {
                                        tempSelectedSize = size;
                                        tempSelectedVariant = matchingVariant;
                                      });
                                    },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 20, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isOutOfStock
                                      ? Colors.grey[100]
                                      : Colors.white,
                                  border: Border.all(
                                    color: isSelected
                                        ? Colors.black
                                        : Colors.grey[300]!,
                                    width: isSelected ? 2 : 1,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  isOutOfStock ? '$size (Hết)' : size!,
                                  style: TextStyle(
                                    fontWeight: isSelected
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                    color: isOutOfStock
                                        ? Colors.grey
                                        : Colors.black,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 24),

                        // Quantity
                        Row(
                          children: [
                            const Text(
                              'Số lượng:',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey[300]!),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove),
                                    onPressed: () {
                                      if (tempQuantity > 1) {
                                        setModalState(() => tempQuantity--);
                                      }
                                    },
                                  ),
                                  Container(
                                    constraints:
                                        const BoxConstraints(minWidth: 40),
                                    child: Text(
                                      '$tempQuantity',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add),
                                    onPressed: () {
                                      final maxStock =
                                          tempSelectedVariant?.stock ?? 0;
                                      if (tempQuantity >= maxStock) {
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          SnackBar(
                                            content: Text(
                                                'Chỉ còn $maxStock sản phẩm trong kho'),
                                            backgroundColor: Colors.orange,
                                            duration: const Duration(
                                                milliseconds: 1500),
                                          ),
                                        );
                                      } else {
                                        setModalState(() => tempQuantity++);
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        // Stock info
                        if (tempSelectedVariant != null)
                          Text(
                            'Còn lại: ${tempSelectedVariant!.stock} sản phẩm',
                            style: TextStyle(
                              fontSize: 13,
                              color: tempSelectedVariant!.stock < 10
                                  ? Colors.red
                                  : Colors.grey[600],
                              fontWeight: tempSelectedVariant!.stock < 10
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                // Bottom button - "THÊM VÀO GIỎ"
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () async {
                          if (tempSelectedVariant == null ||
                              tempSelectedSize == null ||
                              tempSelectedSize!.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content:
                                    Text('Vui lòng chọn đầy đủ màu và size'),
                                backgroundColor: Colors.orange,
                              ),
                            );
                            return;
                          }

                          // Check stock before adding to cart
                          if (tempSelectedVariant!.stock <= 0) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Sản phẩm này đã hết hàng'),
                                backgroundColor: Colors.red,
                              ),
                            );
                            return;
                          }

                          if (tempQuantity > tempSelectedVariant!.stock) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                    'Chỉ còn ${tempSelectedVariant!.stock} sản phẩm trong kho'),
                                backgroundColor: Colors.orange,
                              ),
                            );
                            return;
                          }

                          // Update main state
                          setState(() {
                            _selectedVariant = tempSelectedVariant;
                            _selectedSize = tempSelectedSize;
                            _quantity = tempQuantity;
                          });

                          // Close bottom sheet
                          Navigator.pop(context);

                          // Add to cart
                          await _addToCart();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text(
                          'THÊM VÀO GIỎ',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  String _buildImageUrl(String path) {
    if (widget.buildImageUrl != null) return widget.buildImageUrl!(path);
    return path.startsWith('http') ? path : path;
  }

  List<String> get _allImages {
    final imgs = _fullProduct?.galleryImageUrls() ?? [];
    return imgs.isEmpty
        ? ['https://picsum.photos/seed/${widget.product.id}/600/600']
        : imgs;
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final product = _fullProduct ?? widget.product;
    final images = _allImages;
    final variant = _selectedVariant;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'ELORA',
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
          ),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon:
                const Icon(Icons.shopping_bag_outlined, color: Colors.black87),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const CartScreen(),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline, color: Colors.black87),
            onPressed: () {
              // TODO: Navigate to chat screen
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Breadcrumb
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Trang chủ / TỔNG SẢN PHẨM / ${product.name}',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),

                  // Image Gallery
                  AspectRatio(
                    aspectRatio: 1,
                    child: Stack(
                      children: [
                        PageView.builder(
                          controller: _pageController,
                          onPageChanged: (i) =>
                              setState(() => _currentImageIndex = i),
                          itemCount: images.length,
                          itemBuilder: (_, i) {
                            return Image.network(
                              _buildImageUrl(images[i]),
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                color: Colors.grey[200],
                                child: const Icon(Icons.image_not_supported,
                                    size: 64),
                              ),
                            );
                          },
                        ),
                        // Image counter
                        Positioned(
                          right: 16,
                          bottom: 16,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.grey[300]!),
                            ),
                            child: Text(
                              '${_currentImageIndex + 1}/${images.length}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Product Info
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Product name
                        Text(
                          product.name,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 12),

                        // SKU & Stock
                        Row(
                          children: [
                            Text(
                              'SKU: TRQH${product.id.toString().padLeft(6, '0')}${variant != null ? 'SHA${variant.id.toString().padLeft(2, '0')}' : ''}',
                              style: TextStyle(
                                color: Colors.grey[700],
                                fontSize: 13,
                              ),
                            ),
                            const Spacer(),
                            TextButton(
                              onPressed: () {},
                              child: Text(
                                'Hiện tại còn ${variant?.stock ?? 0} sản phẩm.',
                                style: TextStyle(
                                  color: Colors.grey[600],
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),

                        // Price
                        Text(
                          '${(variant?.price ?? product.minPrice ?? 0).toStringAsFixed(0)}đ',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Zalo consultation
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.blue[50],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                decoration: const BoxDecoration(
                                  color: Colors.blue,
                                  shape: BoxShape.circle,
                                ),
                                child: const Center(
                                  child: Text(
                                    'Z',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Text(
                                  'Nhắn để được tư vấn và nhận ưu đãi',
                                  style: TextStyle(fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Payment options (Fundiin)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF00D4FF), Color(0xFF7B61FF)],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.percent,
                                  color: Colors.blue,
                                  size: 32,
                                ),
                              ),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Giảm đến 50K khi thanh toán qua Fundiin.',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    Text(
                                      'Xem thêm',
                                      style: TextStyle(
                                        color: Colors.white,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Color selection
                        const Text(
                          'Chọn màu',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 120,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: product.variants.length,
                            itemBuilder: (_, i) {
                              final v = product.variants[i];
                              final isSelected = _selectedVariant?.id == v.id;
                              final img = v.images.isNotEmpty
                                  ? v.images.first.url
                                  : images.first;
                              return GestureDetector(
                                onTap: () =>
                                    setState(() => _selectedVariant = v),
                                child: Container(
                                  width: 80,
                                  margin: const EdgeInsets.only(right: 12),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isSelected
                                          ? Colors.black
                                          : Colors.grey[300]!,
                                      width: isSelected ? 2 : 1,
                                    ),
                                  ),
                                  child: Column(
                                    children: [
                                      Expanded(
                                        child: ClipRRect(
                                          borderRadius:
                                              const BorderRadius.vertical(
                                            top: Radius.circular(7),
                                          ),
                                          child: Image.network(
                                            _buildImageUrl(img),
                                            fit: BoxFit.cover,
                                            width: double.infinity,
                                            errorBuilder: (_, __, ___) =>
                                                Container(
                                              color: Colors.grey[200],
                                            ),
                                          ),
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.all(4),
                                        child: Text(
                                          v.color ?? v.displayName,
                                          style: const TextStyle(fontSize: 11),
                                          textAlign: TextAlign.center,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Size selection
                        Row(
                          children: [
                            ...product.variants
                                .map((v) => v.size)
                                .where((s) => s != null && s.isNotEmpty)
                                .toSet()
                                .map((size) => Padding(
                                      padding: const EdgeInsets.only(right: 8),
                                      child: _sizeButton(
                                        size!,
                                        isSelected: _selectedSize == size,
                                        onTap: () {
                                          setState(() {
                                            _selectedSize = size;
                                            // Tìm variant phù hợp với size và color
                                            final matchingVariant = product
                                                .variants
                                                .where((v) =>
                                                    v.size == size &&
                                                    (_selectedVariant == null ||
                                                        v.color ==
                                                            _selectedVariant
                                                                ?.color))
                                                .firstOrNull;
                                            if (matchingVariant != null) {
                                              _selectedVariant =
                                                  matchingVariant;
                                            }
                                          });
                                        },
                                      ),
                                    ))
                                .toList(),
                            const Spacer(),
                            TextButton(
                              onPressed: () {},
                              child: const Row(
                                children: [
                                  Text('Bảng size'),
                                  Icon(Icons.chevron_right, size: 18),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Quantity
                        Row(
                          children: [
                            const Text(
                              'Số lượng:',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey[300]!),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove),
                                    onPressed: () {
                                      if (_quantity > 1) {
                                        setState(() => _quantity--);
                                      }
                                    },
                                  ),
                                  Container(
                                    constraints:
                                        const BoxConstraints(minWidth: 40),
                                    child: Text(
                                      '$_quantity',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add),
                                    onPressed: () {
                                      final maxStock =
                                          _selectedVariant?.stock ?? 0;
                                      if (_quantity >= maxStock) {
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          SnackBar(
                                            content: Text(
                                                'Chỉ còn $maxStock sản phẩm trong kho'),
                                            backgroundColor: Colors.orange,
                                            duration: const Duration(
                                                milliseconds: 1500),
                                          ),
                                        );
                                      } else {
                                        setState(() => _quantity++);
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        // Stock info
                        if (_selectedVariant != null)
                          Text(
                            'Còn lại: ${_selectedVariant!.stock} sản phẩm',
                            style: TextStyle(
                              fontSize: 13,
                              color: _selectedVariant!.stock < 10
                                  ? Colors.red
                                  : Colors.grey[600],
                              fontWeight: _selectedVariant!.stock < 10
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        const SizedBox(height: 16),

                        // Showroom link
                        TextButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.location_on_outlined),
                          label: const Text('Xem Showroom còn hàng'),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.orange,
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Expandable sections
                        _buildExpandableSection(
                          'Chi tiết sản phẩm',
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (variant?.material != null &&
                                  variant!.material!.isNotEmpty)
                                _detailRow('Chất liệu', variant.material!),
                              if (variant?.color != null &&
                                  variant!.color!.isNotEmpty)
                                _detailRow('Màu sắc', variant.color!),
                              if (variant?.size != null &&
                                  variant!.size!.isNotEmpty)
                                _detailRow('Kích thước', variant.size!),
                              if (variant?.desc != null &&
                                  variant!.desc!.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Text(
                                    variant.desc!,
                                    style: TextStyle(
                                      color: Colors.grey[700],
                                      height: 1.5,
                                    ),
                                  ),
                                ),
                              if (variant == null ||
                                  (variant.material == null &&
                                      variant.color == null &&
                                      variant.size == null &&
                                      variant.desc == null))
                                Text(
                                  'Thông tin chi tiết sản phẩm đang được cập nhật.',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const Divider(),
                        _buildExpandableSection(
                          'Hướng dẫn bảo quản',
                          Text(
                            '• Giặt máy ở chế độ nhẹ\n• Không sử dụng chất tẩy\n• Phơi nơi thoáng mát\n• Là ở nhiệt độ thấp',
                            style:
                                TextStyle(color: Colors.grey[700], height: 1.8),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Ratings section
                        Row(
                          children: [
                            const Text(
                              'Đánh giá sản phẩm',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.5,
                              ),
                            ),
                            if (_avgRating != null) ...[
                              const SizedBox(width: 12),
                              const Icon(Icons.star,
                                  color: Colors.orange, size: 20),
                              const SizedBox(width: 4),
                              Text(
                                _avgRating!.toStringAsFixed(1),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                ' (${_ratings.length})',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (_canRate)
                          ElevatedButton.icon(
                            onPressed: _showRatingDialog,
                            icon: const Icon(Icons.rate_review, size: 20),
                            label: const Text('Viết đánh giá'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        const SizedBox(height: 16),
                        if (_loadingRatings)
                          const Center(child: CircularProgressIndicator())
                        else if (_ratings.isEmpty)
                          Text(
                            'Chưa có đánh giá nào. Hãy là người đầu tiên!',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontStyle: FontStyle.italic,
                            ),
                          )
                        else
                          ..._ratings.take(3).map((r) => _buildRatingCard(r)),
                        if (_ratings.length > 3)
                          TextButton(
                            onPressed: () {
                              // Show all ratings in dialog
                              showDialog(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: const Text('Tất cả đánh giá'),
                                  content: SizedBox(
                                    width: double.maxFinite,
                                    child: ListView(
                                      shrinkWrap: true,
                                      children: _ratings
                                          .map((r) => _buildRatingCard(r))
                                          .toList(),
                                    ),
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.of(ctx).pop(),
                                      child: const Text('Đóng'),
                                    ),
                                  ],
                                ),
                              );
                            },
                            child: const Text('Xem tất cả đánh giá'),
                          ),
                        const SizedBox(height: 24),

                        // "Có thể bạn sẽ thích" section
                        const Text(
                          'Có thể bạn sẽ thích',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (_loadingYouMayLike)
                          const Center(child: CircularProgressIndicator())
                        else if (_youMayLike.isNotEmpty)
                          GridView.count(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisCount: 2,
                            childAspectRatio: 0.7,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            children: _youMayLike
                                .map((product) => _buildProductCard(product))
                                .toList(),
                          ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom actions
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      // Check if all variants are out of stock
                      final hasStock = product.variants.any((v) => v.stock > 0);
                      if (!hasStock) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Sản phẩm đã hết hàng'),
                            backgroundColor: Colors.red,
                          ),
                        );
                        return;
                      }
                      // Show variant selector bottom sheet before adding to cart
                      _showAddToCartVariantSelector();
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: Colors.red),
                    ),
                    child: const Text(
                      'THÊM VÀO GIỎ',
                      style: TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      // Check if all variants are out of stock
                      final hasStock = product.variants.any((v) => v.stock > 0);
                      if (!hasStock) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Sản phẩm đã hết hàng'),
                            backgroundColor: Colors.red,
                          ),
                        );
                        return;
                      }
                      // Show variant selector bottom sheet before checkout
                      _showBuyNowVariantSelector();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text(
                      'MUA NGAY',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sizeButton(String size,
      {bool isSelected = false, VoidCallback? onTap}) {
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        side: BorderSide(
          color: isSelected ? Colors.black : Colors.grey[300]!,
          width: isSelected ? 2 : 1,
        ),
        backgroundColor:
            isSelected ? Colors.black.withOpacity(0.05) : Colors.white,
      ),
      child: Text(
        size,
        style: TextStyle(
          color: isSelected ? Colors.black : Colors.black87,
          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        ),
      ),
    );
  }

  // Show bottom sheet for variant selection when buying now
  void _showBuyNowVariantSelector() {
    final product = _fullProduct ?? widget.product;
    ProductVariant? tempSelectedVariant = _selectedVariant;
    String? tempSelectedSize = _selectedSize;
    int tempQuantity = _quantity;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.75,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: Colors.grey[200]!),
                    ),
                  ),
                  child: Row(
                    children: [
                      // Product image
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(7),
                          child: tempSelectedVariant?.images.isNotEmpty == true
                              ? Image.network(
                                  _buildImageUrl(
                                      tempSelectedVariant!.images.first.url),
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      Container(color: Colors.grey[200]),
                                )
                              : product.variants.isNotEmpty &&
                                      product.variants.first.images.isNotEmpty
                                  ? Image.network(
                                      _buildImageUrl(product
                                          .variants.first.images.first.url),
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) =>
                                          Container(color: Colors.grey[200]),
                                    )
                                  : Container(color: Colors.grey[200]),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Price and close button
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${tempSelectedVariant?.price.toStringAsFixed(0) ?? (product.variants.isNotEmpty ? product.variants.first.price.toStringAsFixed(0) : "0")}đ',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.red,
                              ),
                            ),
                            if (tempSelectedVariant != null)
                              Text(
                                'Màu: ${tempSelectedVariant?.color ?? "N/A"} | Size: ${tempSelectedSize ?? "N/A"}',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey[600],
                                ),
                              ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
                // Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Color selection
                        const Text(
                          'Chọn màu',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 140, // Increased height for "Hết hàng" label
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: product.variants.length,
                            itemBuilder: (_, i) {
                              final v = product.variants[i];
                              final isSelected =
                                  tempSelectedVariant?.id == v.id;
                              final isOutOfStock = v.stock <= 0;
                              final img = v.images.isNotEmpty
                                  ? v.images.first.url
                                  : (product.variants.isNotEmpty &&
                                          product
                                              .variants.first.images.isNotEmpty
                                      ? product.variants.first.images.first.url
                                      : '');
                              return GestureDetector(
                                onTap: isOutOfStock
                                    ? null
                                    : () {
                                        setModalState(() {
                                          tempSelectedVariant = v;
                                          tempSelectedSize = v.size;
                                        });
                                      },
                                child: Opacity(
                                  opacity: isOutOfStock ? 0.5 : 1.0,
                                  child: Container(
                                    width: 80,
                                    margin: const EdgeInsets.only(right: 12),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: isOutOfStock
                                            ? Colors.grey[300]!
                                            : (isSelected
                                                ? Colors.black
                                                : Colors.grey[300]!),
                                        width: isSelected ? 2 : 1,
                                      ),
                                    ),
                                    child: Column(
                                      children: [
                                        Expanded(
                                          child: Stack(
                                            children: [
                                              ClipRRect(
                                                borderRadius:
                                                    const BorderRadius.vertical(
                                                  top: Radius.circular(7),
                                                ),
                                                child: img.isNotEmpty
                                                    ? Image.network(
                                                        _buildImageUrl(img),
                                                        fit: BoxFit.cover,
                                                        width: double.infinity,
                                                        errorBuilder: (_, __,
                                                                ___) =>
                                                            Container(
                                                                color: Colors
                                                                    .grey[200]),
                                                      )
                                                    : Container(
                                                        color:
                                                            Colors.grey[200]),
                                              ),
                                              if (isOutOfStock)
                                                Positioned.fill(
                                                  child: Container(
                                                    color: Colors.black
                                                        .withOpacity(0.3),
                                                    child: const Center(
                                                      child: Text(
                                                        'Hết hàng',
                                                        style: TextStyle(
                                                          color: Colors.white,
                                                          fontSize: 10,
                                                          fontWeight:
                                                              FontWeight.bold,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.all(4),
                                          child: Text(
                                            v.color ?? v.displayName,
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: isOutOfStock
                                                  ? Colors.grey
                                                  : Colors.black,
                                            ),
                                            textAlign: TextAlign.center,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Size selection - only show sizes available for selected color
                        const Text(
                          'Chọn size',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: product.variants
                              .where((v) =>
                                  tempSelectedVariant == null ||
                                  v.color == tempSelectedVariant?.color)
                              .map((v) => v.size)
                              .where((s) => s != null && s.isNotEmpty)
                              .toSet()
                              .map((size) {
                            final isSelected = tempSelectedSize == size;
                            // Check if this size is out of stock for selected color
                            final matchingVariant = product.variants
                                .where((v) =>
                                    v.size == size &&
                                    (tempSelectedVariant == null ||
                                        v.color == tempSelectedVariant?.color))
                                .firstOrNull;
                            final isOutOfStock = matchingVariant == null ||
                                matchingVariant.stock <= 0;

                            return GestureDetector(
                              onTap: isOutOfStock
                                  ? null
                                  : () {
                                      setModalState(() {
                                        tempSelectedSize = size;
                                        tempSelectedVariant = matchingVariant;
                                      });
                                    },
                              child: Opacity(
                                opacity: isOutOfStock ? 0.5 : 1.0,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 20, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: isOutOfStock
                                        ? Colors.grey[100]
                                        : Colors.white,
                                    border: Border.all(
                                      color: isOutOfStock
                                          ? Colors.grey[300]!
                                          : (isSelected
                                              ? Colors.black
                                              : Colors.grey[300]!),
                                      width: isSelected ? 2 : 1,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    isOutOfStock ? '$size! (Hết)' : size!,
                                    style: TextStyle(
                                      fontWeight: isSelected
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                      color: isOutOfStock
                                          ? Colors.grey
                                          : Colors.black,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 24),

                        // Quantity
                        Row(
                          children: [
                            const Text(
                              'Số lượng:',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey[300]!),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove),
                                    onPressed: () {
                                      if (tempQuantity > 1) {
                                        setModalState(() => tempQuantity--);
                                      }
                                    },
                                  ),
                                  Container(
                                    constraints:
                                        const BoxConstraints(minWidth: 40),
                                    child: Text(
                                      '$tempQuantity',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add),
                                    onPressed: () {
                                      final maxStock =
                                          tempSelectedVariant?.stock ?? 0;
                                      if (tempQuantity >= maxStock) {
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          SnackBar(
                                            content: Text(
                                                'Chỉ còn $maxStock sản phẩm trong kho'),
                                            backgroundColor: Colors.orange,
                                            duration: const Duration(
                                                milliseconds: 1500),
                                          ),
                                        );
                                      } else {
                                        setModalState(() => tempQuantity++);
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        // Stock info
                        if (tempSelectedVariant != null)
                          Text(
                            'Còn lại: ${tempSelectedVariant!.stock} sản phẩm',
                            style: TextStyle(
                              fontSize: 13,
                              color: tempSelectedVariant!.stock < 10
                                  ? Colors.red
                                  : Colors.grey[600],
                              fontWeight: tempSelectedVariant!.stock < 10
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                // Bottom button
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          if (tempSelectedVariant == null ||
                              tempSelectedSize == null ||
                              tempSelectedSize!.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content:
                                    Text('Vui lòng chọn đầy đủ màu và size'),
                                backgroundColor: Colors.orange,
                              ),
                            );
                            return;
                          }

                          // Check stock before proceeding to checkout
                          if (tempSelectedVariant!.stock <= 0) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Sản phẩm này đã hết hàng'),
                                backgroundColor: Colors.red,
                              ),
                            );
                            return;
                          }

                          if (tempQuantity > tempSelectedVariant!.stock) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                    'Chỉ còn ${tempSelectedVariant!.stock} sản phẩm trong kho'),
                                backgroundColor: Colors.orange,
                              ),
                            );
                            return;
                          }

                          // Update main state
                          setState(() {
                            _selectedVariant = tempSelectedVariant;
                            _selectedSize = tempSelectedSize;
                            _quantity = tempQuantity;
                          });

                          // Close bottom sheet
                          Navigator.pop(context);

                          // Navigate to checkout
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => CheckoutScreen(
                                source: CheckoutSource.buyNow,
                                variant: tempSelectedVariant!,
                                quantity: tempQuantity,
                                price: tempSelectedVariant!.price,
                                product: product,
                              ),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text(
                          'MUA NGAY',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildExpandableSection(String title, Widget content) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: content,
          ),
        ],
      ),
    );
  }

  Widget _buildRatingCard(Rating rating) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ...List.generate(
                  5,
                  (i) => Icon(
                    i < rating.score ? Icons.star : Icons.star_border,
                    color: Colors.orange,
                    size: 16,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  rating.date.day == DateTime.now().day &&
                          rating.date.month == DateTime.now().month &&
                          rating.date.year == DateTime.now().year
                      ? 'Hôm nay'
                      : '${rating.date.day}/${rating.date.month}/${rating.date.year}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
            if (rating.comment != null && rating.comment!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                rating.comment!,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[800],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(Product product) {
    final firstVariant =
        product.variants.isNotEmpty ? product.variants.first : null;
    final imageUrl = firstVariant?.images.isNotEmpty == true
        ? _buildImageUrl(firstVariant!.images.first.url)
        : 'https://via.placeholder.com/300x400';

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(
              product: product,
              buildImageUrl: widget.buildImageUrl,
            ),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 0.75,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  imageUrl,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  errorBuilder: (_, __, ___) => Container(
                    color: Colors.grey[200],
                    child: const Icon(Icons.image_not_supported, size: 48),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            product.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${(firstVariant?.price ?? product.minPrice ?? 0).toStringAsFixed(0)}đ',
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: TextStyle(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: Colors.grey[800],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
