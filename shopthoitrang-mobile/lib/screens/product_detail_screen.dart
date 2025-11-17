import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/product_model.dart';
import '../models/cart_model.dart';
import '../services/api_client.dart';
import '../services/product_service.dart';
import '../services/order_service.dart';
import '../services/cart_service.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'cart_screen.dart';
import 'checkout_screen.dart';
import '../services/chat_service.dart';
import 'chat_screen.dart';
import '../services/review_service.dart';
import '../models/review_model.dart';
import 'product_reviews_screen.dart';
import '../utils/datetime_utils.dart';
import '../models/product_promotion_info.dart';

const Color kPrimaryBlue = Color(0xFF0D6EFD);

/// Thông tin khuyến mãi cho sản phẩm
class _PromotionInfo {
  final String label; // ví dụ: "Giảm 10% mỗi sản phẩm", "Mua 1 tặng 1"
  final DateTime? endAt;
  final double? percent; // % giảm (nếu có)
  const _PromotionInfo({
    required this.label,
    this.endAt,
    this.percent,
  });
}

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
  VariantSize? _selectedVariantSize;
  int? _soldQuantity;
  int? _availableStock;
  bool _loadingStats = false;
  final NumberFormat _decimalFormatter = NumberFormat.decimalPattern('vi_VN');
  final NumberFormat _compactFormatter =
      NumberFormat.compact(locale: 'vi_VN');
  final NumberFormat _priceFormatter = NumberFormat.decimalPattern('vi_VN');

  // Reviews
  List<Review> _reviews = [];
  bool _loadingReviews = false;

  // "Có thể bạn sẽ thích"
  List<Product> _youMayLike = [];
  bool _loadingYouMayLike = false;
  final Map<int, ProductPromotionInfo> _recommendPromos = {};
  final Map<int, int> _recommendSold = {};

  // Khuyến mãi
  _PromotionInfo? _promotion;
  List<CartGiftOption> _giftOptions = [];
  CartGiftOption? _selectedGiftOption;
  String? _giftPromoLabel;
  bool _loadingPromotion = false;
  final DateFormat _promotionDateFormat = DateFormat('dd/MM/yyyy HH:mm', 'vi_VN');

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _fullProduct = widget.product;
    if (_fullProduct!.variants.isNotEmpty) {
      _selectedVariant = _fullProduct!.variants.first;
      _selectedVariantSize = _firstAvailableSize(_selectedVariant!.sizes);
      _selectedSize = _selectedVariantSize?.name ?? _selectedVariant!.size;
    }

    _loadFullProductDetail();
    _loadReviews();
    _loadYouMayLike();
    _loadProductStats();
    _loadPromotion();
  }

  List<Map<String, dynamic>> _parseGiftVariantSelections(dynamic raw) {
    if (raw == null) return [];
    dynamic source = raw;
    if (source is String) {
      final trimmed = source.trim();
      if (trimmed.isEmpty) return [];
      try {
        source = jsonDecode(trimmed);
      } catch (_) {
        return [];
      }
    }
    if (source is! List) return [];

    return source.whereType<Map>().map((entry) {
      final map = Map<String, dynamic>.from(entry);
      int? parseInt(dynamic value) =>
          value == null ? null : int.tryParse(value.toString());

      return {
        'variantId': parseInt(
              map['variantId'] ??
                  map['maChiTietSanPham'] ??
                  map['machitietsanpham'] ??
                  map['variant_id'] ??
                  map['id'],
            ) ??
            0,
        'productId': parseInt(
          map['productId'] ??
              map['maSanPham'] ??
              map['product_id'] ??
              map['masanpham'],
        ),
        'sizeId': parseInt(
          map['sizeId'] ??
              map['kichThuocId'] ??
              map['size_id'] ??
              map['machitietsanpham_kichthuoc'] ??
              map['bridgeId'],
        ),
        'buyQty': parseInt(
              map['buyQty'] ??
                  map['soLuongMua'] ??
                  map['so_luong_mua'] ??
                  map['buy_qty'],
            ) ??
            1,
        'giftQty': parseInt(
              map['giftQty'] ??
                  map['soLuongTang'] ??
                  map['so_luong_tang'] ??
                  map['gift_qty'],
            ) ??
            1,
      };
    }).where((m) => (m['variantId'] as int) > 0).toList();
  }


  int _minGiftBuyRequirement() {
    if (_giftOptions.isEmpty) return 0;
    return _giftOptions
        .map((e) => e.buyQty)
        .reduce((a, b) => a < b ? a : b);
  }

  List<CartGiftOption> _eligibleGiftOptionsForQuantity(int quantity) {
    if (_giftOptions.isEmpty) return const [];
    return _giftOptions
        .where((opt) => quantity >= opt.buyQty)
        .toList(growable: false);
  }

  Future<List<CartGiftOption>> _buildGiftOptionsFromPromotion(
      Map<String, dynamic> promo) async {
    final rawSelections = promo['sanpham_tang_variants'] ??
        promo['sanPhamTangVariants'] ??
        promo['giftVariants'];
    final parsed = _parseGiftVariantSelections(rawSelections);
    if (parsed.isEmpty) return [];

    final svc = ProductService(ApiClient());
    final List<CartGiftOption> options = [];

    for (final entry in parsed) {
      final variantId = entry['variantId'] as int;
      final info = await svc.getProductWithVariantByVariantId(variantId);
      if (info == null) continue;

      final variant = info.variant;
      final product = info.product;

      options.add(CartGiftOption(
        variantId: variant.id,
        productId: variant.productId,
        sizeBridgeId: entry['sizeId'] as int?,
        name: product.name,
        label: variant.displayName,
        sizeLabel: variant.size,
        color: variant.color,
        imageUrl: variant.images.isNotEmpty
            ? variant.images.first.url
            : product.coverImage,
        promoLabel: promo['tenchuongtrinh']?.toString() ??
            promo['tenChuongTrinh']?.toString() ??
            '',
        buyQty: entry['buyQty'] as int? ?? 1,
        giftQty: entry['giftQty'] as int? ?? 1,
        eligibleQuantity: 0,
      ));
    }

    return options;
  }

  Future<void> _loadReviews() async {
    setState(() => _loadingReviews = true);
    try {
      final reviews =
          await reviewService.getReviews(productId: widget.product.id);
      if (reviews != null && mounted) {
        setState(() => _reviews = reviews);
      }
    } catch (e) {
      debugPrint('Error loading reviews: $e');
    } finally {
      if (mounted) setState(() => _loadingReviews = false);
    }
  }

  Future<void> _loadFullProductDetail() async {
    try {
      final api = ApiClient();
      final svc = ProductService(api);
      final fresh = await svc.getByIdWithImages(widget.product.id);
      if (!mounted || fresh == null) return;

      setState(() {
        _fullProduct = fresh;

        final currentVariantId = _selectedVariant?.id;
        ProductVariant? updatedVariant;
        if (currentVariantId != null) {
          for (final variant in fresh.variants) {
            if (variant.id == currentVariantId) {
              updatedVariant = variant;
              break;
            }
          }
        }
        updatedVariant ??=
            fresh.variants.isNotEmpty ? fresh.variants.first : null;
        _selectedVariant = updatedVariant;

        final currentSizeId = _selectedVariantSize?.id;
        final currentSizeName = _selectedVariantSize?.name;
        VariantSize? updatedSize;
        if (updatedVariant != null && updatedVariant.sizes.isNotEmpty) {
          if (currentSizeId != null) {
            for (final size in updatedVariant.sizes) {
              if (size.id == currentSizeId ||
                  (size.sizeId != null &&
                      size.sizeId == _selectedVariantSize?.sizeId)) {
                updatedSize = size;
                break;
              }
            }
          }
          if (updatedSize == null && currentSizeName != null) {
            for (final size in updatedVariant.sizes) {
              if (size.name == currentSizeName) {
                updatedSize = size;
                break;
              }
            }
          }
          updatedSize ??= _firstAvailableSize(updatedVariant.sizes);
        }

        _selectedVariantSize = updatedSize;
        _selectedSize = updatedSize?.name ?? updatedVariant?.size;
      });
    } catch (e) {
      debugPrint('Error loading full product detail: $e');
    }
  }

  Future<Map<int, ProductPromotionInfo>> _fetchPromotionsForProducts(
      Set<int> productIds) async {
    if (productIds.isEmpty) return {};
    try {
      final api = ApiClient();
      final res = await api.get('/khuyenmai');
      dynamic raw = res['data'] ?? res['items'] ?? res;
      if (raw is! List) return {};
      final now = vietnamNow();
      final Map<int, ProductPromotionInfo> result = {};

      for (final item in raw) {
        if (item is! Map) continue;
        final j = Map<String, dynamic>.from(item);
        final info = ProductPromotionInfo.fromJson(j);

        bool active = true;
        if (info.startAt != null && now.isBefore(info.startAt!)) active = false;
        if (info.endAt != null && now.isAfter(info.endAt!)) active = false;
        final status =
            (j['trangthai'] ?? j['trangThai'] ?? '').toString().toLowerCase();
        if (status.isNotEmpty &&
            !status.contains('dang') &&
            !status.contains('dang')) {
          active = false;
        }
        if (!active) continue;

        final ids = <int>{};
        final rawApply = j['sanpham_apdung_ids'] ??
            j['sanPhamApDungIds'] ??
            j['sanphamIds'];
        if (rawApply is List) {
          for (final v in rawApply) {
            final id = int.tryParse(v.toString());
            if (id != null) ids.add(id);
          }
        } else if (rawApply is String) {
          final matches = RegExp(r'\d+').allMatches(rawApply);
          for (final m in matches) {
            final id = int.tryParse(m.group(0)!);
            if (id != null) ids.add(id);
          }
        }
        final singleId = j['masanpham'];
        if (singleId != null) {
          final id = int.tryParse(singleId.toString());
          if (id != null) ids.add(id);
        }

        for (final pid in ids) {
          if (productIds.contains(pid)) {
            result[pid] = info;
          }
        }
      }
      return result;
    } catch (e) {
      debugPrint('Error fetching promo map: $e');
      return {};
    }
  }

  Future<void> _loadYouMayLike() async {
    setState(() => _loadingYouMayLike = true);
    try {
      final api = ApiClient();
      final svc = ProductService(api);
      final list =
          await svc.listWithImages(limit: 12, orderBy: 'rating', sortDesc: true);

      final idSet = list.map((e) => e.id).toSet();
      final promoMap = await _fetchPromotionsForProducts(idSet);
      final soldMap = <int, int>{};
      for (final item in list) {
        try {
          final stats = await svc.getStats(item.id);
          soldMap[item.id] = stats.sold;
        } catch (_) {
          soldMap[item.id] = 0;
        }
      }

      final categoryId = widget.product.categoryId;
      list.sort((a, b) {
        final sameCatA = categoryId != null && a.categoryId == categoryId;
        final sameCatB = categoryId != null && b.categoryId == categoryId;
        if (sameCatA != sameCatB) return sameCatA ? -1 : 1;

        final promoA = promoMap.containsKey(a.id);
        final promoB = promoMap.containsKey(b.id);
        if (promoA != promoB) return promoA ? -1 : 1;

        final soldA = soldMap[a.id] ?? 0;
        final soldB = soldMap[b.id] ?? 0;
        if (soldA != soldB) return soldB.compareTo(soldA);

        return a.name.compareTo(b.name);
      });

      final filtered = list.where((p) => p.id != widget.product.id).toList();
      final limited = filtered.take(6).toList();

      if (mounted) {
        setState(() {
          _youMayLike = limited;
          _recommendPromos
            ..clear()
            ..addEntries(limited
                .where((p) => promoMap.containsKey(p.id))
                .map((p) => MapEntry(p.id, promoMap[p.id]!)));
          _recommendSold
            ..clear()
            ..addEntries(
                limited.map((p) => MapEntry(p.id, soldMap[p.id] ?? 0)));
        });
      }
    } catch (e) {
      debugPrint('Error loading recommended: $e');
    } finally {
      if (mounted) setState(() => _loadingYouMayLike = false);
    }
  }

  Future<void> _loadProductStats() async {
    setState(() => _loadingStats = true);
    try {
      final api = ApiClient();
      final svc = ProductService(api);
      final stats = await svc.getStats(widget.product.id);
      if (!mounted) return;
      setState(() {
        _soldQuantity = stats.sold;
        _availableStock = stats.stock;
      });
    } catch (e) {
      debugPrint('Error loading product stats: $e');
    } finally {
      if (mounted) setState(() => _loadingStats = false);
    }
  }

  /// Tải thông tin khuyến mãi áp dụng cho sản phẩm hiện tại
  Future<void> _loadPromotion() async {
    setState(() => _loadingPromotion = true);
    try {
      final api = ApiClient();
      final res = await api.get('/khuyenmai'); // sửa path nếu backend khác

      dynamic rawList = res['data'] ?? res['items'] ?? res;
      if (rawList is! List) return;

      final now = vietnamNow();
      final int productId = widget.product.id;
      _PromotionInfo? chosen;

      for (final item in rawList) {
        if (item is! Map) continue;
        final j = Map<String, dynamic>.from(item);

        final rawStart = j['ngaybatdau'] ?? j['ngayBatDau'];
        final rawEnd = j['ngayketthuc'] ?? j['ngayKetThuc'];
        final start = parseVietnamDateTime(rawStart);
        final end = parseVietnamDateTime(rawEnd);

        bool active = true;
        if (start != null && now.isBefore(start)) active = false;
        if (end != null && now.isAfter(end)) active = false;

        final status = (j['trangthai'] ?? j['trangThai'] ?? '')
            .toString()
            .toLowerCase();
        if (status.isNotEmpty &&
            !status.contains('dang') &&
            !status.contains('dang')) {
          active = false;
        }
        if (!active) continue;

        final productIds = <int>{};

        final rawApply = j['sanpham_apdung_ids'] ??
            j['sanPhamApDungIds'] ??
            j['sanphamIds'];

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

        if (!productIds.contains(productId)) continue;

        double? percent;
        final rawPercent =
            j['tylegiam'] ?? j['tyLeGiam'] ?? j['tiLeGiam'] ?? j['phanTram'];
        if (rawPercent is num && rawPercent > 0) {
          percent = rawPercent.toDouble();
        } else if (rawPercent != null) {
          final p = double.tryParse(rawPercent.toString());
          if (p != null && p > 0) percent = p;
        }

        String? label;
        final loai = j['loaikhuyenmai'] is Map<String, dynamic>
            ? j['loaikhuyenmai'] as Map<String, dynamic>
            : null;
        final rawType =
            (j['loaikhuyenmai'] is String ? j['loaikhuyenmai'] : j['loai'])
                ?.toString();

        label = (loai?['tenloai'] ??
                loai?['tenLoai'] ??
                j['tenloai'] ??
                j['tenLoai'])
            ?.toString()
            .trim();
        if ((label == null || label.isEmpty) && rawType != null) {
          label = rawType == 'GIAM_PERCENT'
              ? 'Giảm %'
              : rawType == 'TANG'
                  ? 'Tặng'
                  : rawType;
        }

        if (label == null || label.isEmpty) {
          final ct =
              (j['tenchuongtrinh'] ?? j['tenChuongTrinh'] ?? '').toString();
          if (ct.isNotEmpty) {
            label = ct;
          } else if (percent != null) {
            final formatted = (percent % 1 == 0)
                ? percent.toStringAsFixed(0)
                : percent.toStringAsFixed(1);
            label = 'Giảm $formatted%';
          } else {
            label = '';
          }
        }

        final info = _PromotionInfo(
          label: label,
          endAt: end,
          percent: percent,
        );

        if (chosen == null ||
            (chosen.endAt != null &&
                info.endAt != null &&
                info.endAt!.isBefore(chosen.endAt!))) {
          chosen = info;

          final giftOptions = await _buildGiftOptionsFromPromotion(j);
          if (mounted) {
            _giftOptions = giftOptions;
            _selectedGiftOption =
                giftOptions.isNotEmpty ? giftOptions.first : null;
            _giftPromoLabel = label;
          }
        }
      }

      if (!mounted) return;
      setState(() {
        _promotion = chosen;
        if (chosen == null) {
          _giftOptions = [];
          _selectedGiftOption = null;
          _giftPromoLabel = null;
        }
      });
    } catch (e) {
      debugPrint('Error loading promotion detail: $e');
    } finally {
      if (mounted) setState(() => _loadingPromotion = false);
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
                child: const Text('Hủy'),
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
        sizeBridgeId: _selectedVariantSize?.id,
      );

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Đã thêm vào giỏ hàng'),
          backgroundColor: Colors.green,
          duration: Duration(milliseconds: 1200),
        ));
        if (!mounted) return;
        await Future.delayed(const Duration(milliseconds: 200));
        if (!mounted) return;
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

  // BOTTOM SHEET: ch?n bi?n th? khi th�m v�o gi?
  void _showAddToCartVariantSelector() {
    final product = _fullProduct ?? widget.product;
    ProductVariant? tempSelectedVariant = _selectedVariant;
    String? tempSelectedSize = _selectedSize;
    VariantSize? tempSelectedVariantSize = _selectedVariantSize;
    int tempQuantity = _quantity;
    CartGiftOption? tempSelectedGiftOption = _selectedGiftOption;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          int tempStock() {
            if (tempSelectedVariantSize != null) {
              return tempSelectedVariantSize!.stock;
            }
            return _variantStock(tempSelectedVariant);
          }

          bool isSameGift(CartGiftOption a, CartGiftOption b) =>
              a.variantId == b.variantId &&
              (a.sizeBridgeId ?? 0) == (b.sizeBridgeId ?? 0);

          void ensureGiftSelection() {
            final eligible =
                _eligibleGiftOptionsForQuantity(tempQuantity);
            if (eligible.isEmpty) {
              tempSelectedGiftOption = null;
            } else if (tempSelectedGiftOption == null ||
                !eligible.any(
                    (opt) => isSameGift(opt, tempSelectedGiftOption!))) {
              tempSelectedGiftOption = eligible.first;
            }
          }

          ensureGiftSelection();
          
          final eligibleOptions =
              _eligibleGiftOptionsForQuantity(tempQuantity);

          // ---- TÍNH GIÁ + KHUYẾN MÃI (BOTTOM SHEET) ----
          final double basePriceHeader =
              (tempSelectedVariant?.price ??
                      (product.variants.isNotEmpty
                          ? product.variants.first.price
                          : 0))
                  .toDouble();
          final double? discountPercentHeader = _promotion?.percent;
          double finalPriceHeader = basePriceHeader;
          if (discountPercentHeader != null && discountPercentHeader > 0) {
            finalPriceHeader =
                basePriceHeader * (1 - discountPercentHeader / 100);
          }
          String formatPrice(num v) => '${_decimalFormatter.format(v)}đ';
          // ------------------------------------------------

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
                            Row(
                              children: [
                                if (discountPercentHeader != null &&
                                    discountPercentHeader > 0) ...[
                                  Text(
                                    formatPrice(basePriceHeader),
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: kPrimaryBlue,
                                      decoration: TextDecoration.lineThrough,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    formatPrice(finalPriceHeader),
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: Color.fromARGB(255, 54, 60, 244),
                                    ),
                                  ),
                                ] else ...[
                                  Text(
                                    formatPrice(basePriceHeader),
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: kPrimaryBlue,
                                    ),
                                  ),
                                ]
                              ],
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
                          'Chọn màu sắc',
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
                              final isOutOfStock = _variantStock(v) <= 0;
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
                                          tempSelectedVariantSize =
                                              _firstAvailableSize(v.sizes);
                                          tempSelectedSize =
                                              tempSelectedVariantSize?.name ??
                                                  v.size;
                                          tempQuantity = 1;
                                          ensureGiftSelection();
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
                                                ? kPrimaryBlue
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
                        

                        // Size selection
                        const Text(
                          'Chọn size',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Builder(
                          builder: (_) {
                            final sizeList = _sortedSizes(
                              tempSelectedVariant?.sizes ?? const [],
                            );

                            if (sizeList.isEmpty) {
                              return Text(
                                'Chưa có size có thể cho biến thể này.',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontStyle: FontStyle.italic,
                                ),
                              );
                            }

                            return Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: sizeList
                                  .map(
                                    (sizeRow) => _sizeButton(
                                      sizeRow.name.isNotEmpty
                                          ? sizeRow.name
                                          : 'N/A',
                                      stock: sizeRow.stock,
                                      isSelected: tempSelectedVariantSize?.id ==
                                          sizeRow.id,
                                      onTap: sizeRow.stock <= 0
                                          ? null
                                          : () {
                                              setModalState(() {
                                                tempSelectedVariantSize =
                                                    sizeRow;
                                                tempSelectedSize = sizeRow.name;
                                                tempQuantity = 1;
                                                ensureGiftSelection();
                                              });
                                            },
                                    ),
                                  )
                                  .toList(),
                            );
                          },
                        ),

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
                                        setModalState(() {
                                          tempQuantity--;
                                          ensureGiftSelection();
                                        });
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
                                      final maxStock = tempStock();
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
                                        setModalState(() {
                                          tempQuantity++;
                                          ensureGiftSelection();
                                        });
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (tempSelectedVariant != null)
                          Text(
                            'Hiện tại còn: ${tempStock()} sản phẩm',
                            style: TextStyle(
                              fontSize: 13,
                              color: tempStock() < 10
                                  ? Colors.red
                                  : Colors.grey[600],
                              fontWeight: tempStock() < 10
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        const SizedBox(height: 16),
                        if (_giftOptions.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Quà tặng khuyến mãi ${_giftPromoLabel ?? ''}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFFFB8C00),
                                ),
                              ),
                              const SizedBox(height: 8),
                              if (eligibleOptions.isEmpty)
                                Text(
                                  _giftOptions.isNotEmpty
                                      ? 'Mua tối thiểu ${_minGiftBuyRequirement()} sản phẩm để chọn quà tặng.'
                                      : 'Chưa đủ điều kiện để nhận quà tặng.',
                                  style: const TextStyle(color: Colors.grey),
                                )
                              else
                                ...eligibleOptions.map(
                                  (opt) {
                                    final optionKey =
                                        '${opt.variantId}_${opt.sizeBridgeId ?? 'null'}';
                                    final selectedKey =
                                        tempSelectedGiftOption == null
                                            ? null
                                            : '${tempSelectedGiftOption!.variantId}_${tempSelectedGiftOption!.sizeBridgeId ?? 'null'}';
                                    final variantParts = <String>[];
                                    if (opt.sizeLabel != null &&
                                        opt.sizeLabel!.isNotEmpty) {
                                      variantParts.add('Size ${opt.sizeLabel}');
                                    }
                                    if (opt.color != null &&
                                        opt.color!.isNotEmpty) {
                                      variantParts.add(opt.color!);
                                    }
                                    final variantLabel = variantParts.join(' / ');

                                    return RadioListTile<String>(
                                      value: optionKey,
                                      groupValue: selectedKey,
                                      contentPadding: EdgeInsets.zero,
                                      dense: true,
                                      onChanged: (_) {
                                        setModalState(() {
                                          tempSelectedGiftOption = opt;
                                        });
                                      },
                                      title: Row(
                                        children: [
                                          Container(
                                            width: 48,
                                            height: 48,
                                            decoration: BoxDecoration(
                                              borderRadius: BorderRadius.circular(8),
                                              image: opt.imageUrl != null
                                                  ? DecorationImage(
                                                      image: NetworkImage(opt.imageUrl!),
                                                      fit: BoxFit.cover,
                                                    )
                                                  : null,
                                              color: Colors.grey[200],
                                            ),
                                            child: opt.imageUrl == null
                                                ? const Icon(Icons.card_giftcard, size: 20)
                                                : null,
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  opt.name,
                                                  style: const TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                                if (variantLabel.isNotEmpty) ...[
                                                  const SizedBox(height: 4),
                                                  Text(
                                                    variantLabel,
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      color: Colors.black54,
                                                    ),
                                                  ),
                                                ],
                                                if (opt.label != null && opt.label!.isNotEmpty)
                                                  Text(
                                                    opt.label!,
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      color: Colors.grey,
                                                    ),
                                                  ),
                                                Text(
                                                  'Mua ${opt.buyQty} tặng ${opt.giftQty}',
                                                  style: const TextStyle(
                                                    fontSize: 12,
                                                    color: Colors.orange,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                            ],
                          ),
                        ],
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
                                    Text('Vui lòng chọn đầy đủ mẫu và size'),
                                backgroundColor: Colors.orange,
                              ),
                            );
                            return;
                          }

                          if (tempStock() <= 0) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Sản phẩm này đã hết hàng'),
                                backgroundColor: Colors.red,
                              ),
                            );
                            return;
                          }

                          if (tempQuantity > tempStock()) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                    'Chỉ còn ${tempStock()} sản phẩm trong kho'),
                                backgroundColor: Colors.orange,
                              ),
                            );
                            return;
                          }

                          setState(() {
                            _selectedVariant = tempSelectedVariant;
                            _selectedSize = tempSelectedSize;
                            _selectedVariantSize = tempSelectedVariantSize;
                            _quantity = tempQuantity;
                            _selectedGiftOption = tempSelectedGiftOption;
                          });

                          Navigator.pop(context);

                          await _addToCart();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color.fromARGB(255, 5, 5, 247),
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

    final double basePrice =
        (variant?.price ?? product.minPrice ?? 0).toDouble();
    final double? discountPercent = _promotion?.percent;
    double finalPrice = basePrice;
    if (discountPercent != null && discountPercent > 0) {
      finalPrice = basePrice * (1 - discountPercent / 100);
    }
    String formatPrice(num v) => '${_decimalFormatter.format(v)}d';

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
            color: kPrimaryBlue,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
          ),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon:
                const Icon(Icons.shopping_bag_outlined, color: kPrimaryBlue),
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
            icon:
                const Icon(Icons.chat_bubble_outline, color: kPrimaryBlue),
            onPressed: () {
              _openChat();
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
                      'Trang chủ / TẤT CẢ SẢN PHẨM / ${product.name}',
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
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: kPrimaryBlue.withOpacity(.08),
                                borderRadius: BorderRadius.circular(30),
                              ),
                              child: Text(
                                'Mã #${product.id}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: kPrimaryBlue,
                                ),
                              ),
                            ),
                            const Spacer(),
                            if (_loadingStats)
                              const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: kPrimaryBlue,
                                ),
                              ),
                            if (_loadingStats) const SizedBox(width: 8),
                            Text(
                              'Đã bán: ${_formatSoldCount()} (${_formatRatingLabel()})',
                              style: const TextStyle(
                                color: kPrimaryBlue,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          product.name,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            if (discountPercent != null &&
                                discountPercent > 0) ...[
                              Text(
                                formatPrice(basePrice),
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: kPrimaryBlue,
                                  decoration: TextDecoration.lineThrough,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                formatPrice(finalPrice),
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.red,
                                ),
                              ),
                            ] else ...[
                              Text(
                                formatPrice(basePrice),
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w700,
                                  color: kPrimaryBlue,
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 6),

                        if (_promotion != null &&
                            (_promotion!.label.isNotEmpty ||
                                _promotion!.endAt != null))
                          Container(
                            width: double.infinity,
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEAF3FF),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: kPrimaryBlue.withOpacity(0.4),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.local_offer,
                                    size: 18, color: kPrimaryBlue),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      if (_promotion!.label.isNotEmpty)
                                        Text(
                                          _promotion!.label,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w700,
                                            color: Colors.red,
                                          ),
                                        ),
                                      if (_promotion!.endAt != null)
                                        Text(
                                          'Kết thúc sau: ${_promotionDateFormat.format(_promotion!.endAt!)}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[700],
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                        const SizedBox(height: 16),

                        const Text(
                          'Chọn mẫu',
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
                                onTap: () => setState(() {
                                  _selectedVariant = v;
                                  _selectedVariantSize =
                                      _firstAvailableSize(v.sizes);
                                  _selectedSize =
                                      _selectedVariantSize?.name ?? v.size;
                                  _quantity = 1;
                                }),
                                child: Container(
                                  width: 80,
                                  margin: const EdgeInsets.only(right: 12),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isSelected
                                          ? kPrimaryBlue
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

                        Row(
                          children: [
                            const Text(
                              'Chọn size',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const Spacer(),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if ((_selectedVariant?.sizes ?? []).isNotEmpty)
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: (_selectedVariant?.sizes ?? [])
                                .map(
                                  (sizeRow) => _sizeButton(
                                    sizeRow.name.isNotEmpty
                                        ? sizeRow.name
                                        : 'N/A',
                                    stock: sizeRow.stock,
                                    isSelected:
                                        _selectedVariantSize?.id == sizeRow.id,
                                    onTap: sizeRow.stock <= 0
                                        ? null
                                        : () {
                                            setState(() {
                                              _selectedVariantSize = sizeRow;
                                              _selectedSize = sizeRow.name;
                                              _quantity = 1;
                                            });
                                          },
                                  ),
                                )
                                .toList(),
                          )
                        else
                          Text(
                            'Chưa có size có thể cho biến thể này.',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 13,
                            ),
                          ),
                        const SizedBox(height: 24),

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
                                      final maxStock = _selectedSizeStock();
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

                        _buildExpandableSection(
                          'Hướng dẫn chọn size',
                          _buildSizeGuideSection(),
                        ),
                        const Divider(),
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
                              if (variant != null &&
                                  variant!.sizes.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Kích thước',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        children: variant!.sizes
                                            .map(
                                              (sz) => Chip(
                                                label: Text(
                                                  sz.name.isNotEmpty
                                                      ? sz.name
                                                      : '',
                                                ),
                                                avatar: sz.stock > 0
                                                    ? null
                                                    : const Icon(
                                                        Icons
                                                            .warning_amber_rounded,
                                                        size: 16,
                                                        color: Colors.orange,
                                                      ),
                                              ),
                                            )
                                            .toList(),
                                      ),
                                    ],
                                  ),
                                )
                              else if (variant?.size != null &&
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
                            'Giặt máy ở chế độ nhẹ\n� Không sử dụng chất tẩy\nPhơi nơi thông mát\nỦi ở nhiệt độ thấp',
                            style:
                                TextStyle(color: Colors.grey[700], height: 1.8),
                          ),
                        ),
                        const SizedBox(height: 24),

                        if (_reviews.isNotEmpty) ...[
                          _buildReviewsSection(),
                          const SizedBox(height: 24),
                        ],

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
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: GridView.count(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              crossAxisCount: 2,
                              childAspectRatio: 0.58,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                          children: _youMayLike
                              .map((p) => _buildProductCard(p))
                              .toList(),
                            ),
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
                      final hasStock =
                          product.variants.any((v) => _variantStock(v) > 0);
                      if (!hasStock) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Sản phẩm đã hết hàng'),
                            backgroundColor: Colors.red,
                          ),
                        );
                        return;
                      }
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
                      final hasStock =
                          product.variants.any((v) => _variantStock(v) > 0);
                      if (!hasStock) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Sản phẩm đã hết hàng'),
                            backgroundColor: Colors.red,
                          ),
                        );
                        return;
                      }
                      _showBuyNowVariantSelector();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color.fromARGB(255, 10, 18, 249),
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

  String _formatSoldCount() {
    final value = _soldQuantity ?? 0;
    return _compactFormatter.format(value);
  }

  String _formatRatingLabel() {
    if (_reviews.isEmpty) return '0.0⭐';
    final total = _reviews.fold<int>(0, (sum, review) => sum + review.rating);
    final avg = total / _reviews.length;
    return '${avg.toStringAsFixed(1)}⭐';
  }

  int _variantStock(ProductVariant? variant) {
    if (variant == null) return 0;
    if (variant.sizes.isNotEmpty) {
      return variant.sizes.fold<int>(
          0, (sum, size) => sum + (size.stock));
    }
    return variant.stock;
  }

  int _selectedSizeStock() {
    if (_selectedVariantSize != null) return _selectedVariantSize!.stock;
    return _variantStock(_selectedVariant);
  }

  List<VariantSize> _sortedSizes(List<VariantSize> sizes) {
    final order = <String, int>{
      'xs': 0,
      's': 1,
      'm': 2,
      'l': 3,
      'xl': 4,
      'xxl': 5,
      '2xl': 5,
      '3xl': 6,
    };
    final list = List<VariantSize>.from(sizes);
    list.sort((a, b) {
      final aKey = order[a.name.trim().toLowerCase()] ?? 100;
      final bKey = order[b.name.trim().toLowerCase()] ?? 100;
      if (aKey != bKey) return aKey.compareTo(bKey);
      return a.name.compareTo(b.name);
    });
    return list;
  }

  VariantSize? _firstAvailableSize(List<VariantSize> sizes) {
    if (sizes.isEmpty) return null;
    return sizes.firstWhere(
      (size) => size.stock > 0,
      orElse: () => sizes.first,
    );
  }

  VariantSize? _sizeByName(ProductVariant? variant, String? sizeName) {
    if (variant == null || variant.sizes.isEmpty) return null;
    if (sizeName == null || sizeName.trim().isEmpty) {
      return _firstAvailableSize(variant.sizes);
    }
    final normalized = sizeName.trim().toLowerCase();
    final fallback =
        _firstAvailableSize(variant.sizes) ?? variant.sizes.first;
    return variant.sizes.firstWhere(
      (size) => size.name.trim().toLowerCase() == normalized,
      orElse: () => fallback,
    );
  }

  Widget _sizeButton(String size,
      {bool isSelected = false, int stock = 0, VoidCallback? onTap}) {
    final disabled = stock <= 0;
    return OutlinedButton(
      onPressed: disabled ? null : onTap,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        side: BorderSide(
          color: isSelected ? kPrimaryBlue : Colors.grey[300]!,
          width: isSelected ? 2 : 1,
        ),
        backgroundColor: isSelected
            ? kPrimaryBlue.withOpacity(0.05)
            : Colors.white,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            size,
            style: TextStyle(
              color: disabled
                  ? Colors.grey
                  : (isSelected ? kPrimaryBlue : Colors.black87),
              fontWeight:
                  isSelected ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
          const SizedBox(height: 2),
        ],
      ),
    );
  }

  // BOTTOM SHEET: mua ngay
  void _showBuyNowVariantSelector() {
    final product = _fullProduct ?? widget.product;
    ProductVariant? tempSelectedVariant = _selectedVariant;
    String? tempSelectedSize = _selectedSize;
    VariantSize? tempSelectedVariantSize = _selectedVariantSize;
    int tempQuantity = _quantity;
    CartGiftOption? tempSelectedGiftOption = _selectedGiftOption;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          int tempStock() =>
              tempSelectedVariantSize?.stock ??
              _variantStock(tempSelectedVariant);
          final sizeList =
              _sortedSizes(tempSelectedVariant?.sizes ?? const []);
          bool isSameGift(CartGiftOption a, CartGiftOption b) =>
              a.variantId == b.variantId &&
              (a.sizeBridgeId ?? 0) == (b.sizeBridgeId ?? 0);

          void ensureGiftSelection() {
            final eligible =
                _eligibleGiftOptionsForQuantity(tempQuantity);
            if (eligible.isEmpty) {
              tempSelectedGiftOption = null;
            } else if (tempSelectedGiftOption == null ||
                !eligible.any(
                    (opt) => isSameGift(opt, tempSelectedGiftOption!))) {
              tempSelectedGiftOption = eligible.first;
            }
          }

          ensureGiftSelection();

          final eligibleOptions =
              _eligibleGiftOptionsForQuantity(tempQuantity);

          // ---- Tặng (BOTTOM SHEET MUA NGAY) ----
          final double basePriceHeader =
              (tempSelectedVariant?.price ??
                      (product.variants.isNotEmpty
                          ? product.variants.first.price
                          : 0))
                  .toDouble();
          final double? discountPercentHeader = _promotion?.percent;
          double finalPriceHeader = basePriceHeader;
          if (discountPercentHeader != null && discountPercentHeader > 0) {
            finalPriceHeader =
                basePriceHeader * (1 - discountPercentHeader / 100);
          }
          String formatPrice(num v) => '${_decimalFormatter.format(v)}d';
          // -------------------------------------------------------

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
                            Row(
                              children: [
                                if (discountPercentHeader != null &&
                                    discountPercentHeader > 0) ...[
                                  Text(
                                    formatPrice(basePriceHeader),
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: kPrimaryBlue,
                                      decoration: TextDecoration.lineThrough,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    formatPrice(finalPriceHeader),
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.red,
                                    ),
                                  ),
                                ] else ...[
                                  Text(
                                    formatPrice(basePriceHeader),
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: kPrimaryBlue,
                                    ),
                                  ),
                                ]
                              ],
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
                              final isOutOfStock = _variantStock(v) <= 0;
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
                                          tempSelectedVariantSize =
                                              _firstAvailableSize(v.sizes);
                                          tempSelectedSize =
                                              tempSelectedVariantSize?.name ??
                                                  v.size;
                                          tempQuantity = 1;
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

                        const Text(
                          'Chọn size',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (sizeList.isNotEmpty)
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: sizeList
                                .map(
                                  (sizeRow) => _sizeButton(
                                    sizeRow.name.isNotEmpty
                                        ? sizeRow.name
                                        : 'N/A',
                                    stock: sizeRow.stock,
                                    isSelected: tempSelectedVariantSize?.id ==
                                        sizeRow.id,
                                    onTap: sizeRow.stock <= 0
                                        ? null
                                        : () {
                                            setModalState(() {
                                              tempSelectedVariantSize =
                                                  sizeRow;
                                              tempSelectedSize = sizeRow.name;
                                              tempQuantity = 1;
                                            });
                                          },
                                  ),
                                )
                                .toList(),
                          )
                        else
                          Text(
                            'Chưa có size có thể cho biến thể này.',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        const SizedBox(height: 24),

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
                                      final maxStock = tempStock();
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
                        if (tempSelectedVariant != null)
                          Text(
                            'Hiện tại còn: ${tempStock()} sản phẩm',
                            style: TextStyle(
                              fontSize: 13,
                              color: tempStock() < 10
                                  ? Colors.red
                                  : Colors.grey[600],
                              fontWeight: tempStock() < 10
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        if (_giftOptions.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Quà tặng khuyến mãi ${_giftPromoLabel ?? ''}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFFFB8C00),
                                ),
                              ),
                              const SizedBox(height: 8),
                              if (eligibleOptions.isEmpty)
                                Text(
                                  _giftOptions.isNotEmpty
                                      ? 'Mua tối thiểu ${_minGiftBuyRequirement()} sản phẩm để chọn quà tặng.'
                                      : 'Chưa đủ điều kiện để nhận quà tặng.',
                                  style: const TextStyle(color: Colors.grey),
                                )
                              else
                                ...eligibleOptions.map(
                                  (opt) {
                                    final optionKey =
                                        '${opt.variantId}_${opt.sizeBridgeId ?? 'null'}';
                                    final selectedKey =
                                        tempSelectedGiftOption == null
                                            ? null
                                            : '${tempSelectedGiftOption!.variantId}_${tempSelectedGiftOption!.sizeBridgeId ?? 'null'}';
                                    final variantParts = <String>[];
                                    if (opt.sizeLabel != null &&
                                        opt.sizeLabel!.isNotEmpty) {
                                      variantParts.add('Size ${opt.sizeLabel}');
                                    }
                                    if (opt.color != null &&
                                        opt.color!.isNotEmpty) {
                                      variantParts.add(opt.color!);
                                    }
                                    final variantLabel = variantParts.join(' / ');

                                    return RadioListTile<String>(
                                      value: optionKey,
                                      groupValue: selectedKey,
                                      contentPadding: EdgeInsets.zero,
                                      dense: true,
                                      onChanged: (_) {
                                        setModalState(() {
                                          tempSelectedGiftOption = opt;
                                        });
                                      },
                                      title: Row(
                                        children: [
                                          Container(
                                            width: 48,
                                            height: 48,
                                            decoration: BoxDecoration(
                                              borderRadius: BorderRadius.circular(8),
                                              image: opt.imageUrl != null
                                                  ? DecorationImage(
                                                      image: NetworkImage(opt.imageUrl!),
                                                      fit: BoxFit.cover,
                                                    )
                                                  : null,
                                              color: Colors.grey[200],
                                            ),
                                            child: opt.imageUrl == null
                                                ? const Icon(Icons.card_giftcard, size: 20)
                                                : null,
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  opt.name,
                                                  style: const TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                                if (variantLabel.isNotEmpty) ...[
                                                  const SizedBox(height: 4),
                                                  Text(
                                                    variantLabel,
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      color: Colors.black54,
                                                    ),
                                                  ),
                                                ],
                                                if (opt.label != null && opt.label!.isNotEmpty)
                                                  Text(
                                                    opt.label!,
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      color: Colors.grey,
                                                    ),
                                                  ),
                                                Text(
                                                  'Mua ${opt.buyQty} tặng ${opt.giftQty}',
                                                  style: const TextStyle(
                                                    fontSize: 12,
                                                    color: Colors.orange,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                            ],
                          ),
                        ],                         
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

                          if (tempStock() <= 0) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Sản phẩm này đã hết hàng'),
                                backgroundColor: Colors.red,
                              ),
                            );
                            return;
                          }

                          if (tempQuantity > tempStock()) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                    'Chỉ còn ${tempStock()} sản phẩm trong kho'),
                                backgroundColor: Colors.orange,
                              ),
                            );
                            return;
                          }

                          setState(() {
                            _selectedVariant = tempSelectedVariant;
                            _selectedSize = tempSelectedSize;
                            _quantity = tempQuantity;
                            _selectedGiftOption = tempSelectedGiftOption;
                          });

                          Navigator.pop(context);

                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => CheckoutScreen(
                                source: CheckoutSource.buyNow,
                                variant: tempSelectedVariant!,
                                quantity: tempQuantity,
                                price: tempSelectedVariant!.price,
                                product: product,
                                sizeBridgeId: tempSelectedVariantSize?.id,
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

  Widget _buildSizeGuideSection() {
    final chartUrl = _fullProduct?.sizeChartUrl ?? widget.product.sizeChartUrl;
    if (chartUrl == null || chartUrl.isEmpty) {
      return Text(
        'Bảng size sẽ được cập nhật trong thời gian tới.',
        style: TextStyle(color: Colors.grey[600]),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Chạm vào hình để xem rõ hơn.',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: () => _showFullSizeChart(chartUrl),
          child: Container(
            constraints: const BoxConstraints(maxHeight: 220),
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                chartUrl,
                fit: BoxFit.contain,
                alignment: Alignment.center,
                loadingBuilder: (context, child, progress) {
                  if (progress == null) return child;
                  return const SizedBox(
                    height: 180,
                    child: Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  );
                },
                errorBuilder: (_, __, ___) => SizedBox(
                  height: 140,
                  child: Center(
                    child: Text(
                      'Không tải được bảng size',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _showFullSizeChart(String url) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          children: [
            InteractiveViewer(
              child: Image.network(
                url,
                fit: BoxFit.contain,
              ),
            ),
            Positioned(
              top: 0,
              right: 0,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(Product product) {
    final cover = product.coverImage ??
        (product.variants.isNotEmpty && product.variants.first.images.isNotEmpty
            ? product.variants.first.images.first.url
            : null);
    final String? imageUrl = cover != null ? _buildImageUrl(cover) : null;
    final firstVariant =
        product.variants.isNotEmpty ? product.variants.first : null;
    final basePrice = firstVariant?.price ?? product.minPrice ?? 0;
    final promo = _recommendPromos[product.id];
    final double? percent = promo?.percent;
    double finalPrice = basePrice;
    if (percent != null && percent > 0) {
      finalPrice = basePrice * (1 - percent / 100);
    }
    final df = DateFormat('dd/MM/yyyy HH:mm', 'vi_VN');
    String formatPrice(num v) => '${_priceFormatter.format(v)}đ';
    final soldLabel = _compactFormatter.format(_recommendSold[product.id] ?? 0);

    return InkWell(
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
          border: Border.all(color: kPrimaryBlue.withOpacity(.12), width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
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
                    if (imageUrl == null)
                      const Center(
                        child: Icon(
                          Icons.image_outlined,
                          color: Colors.black26,
                          size: 40,
                        ),
                      )
                    else
                      Image.network(
                        imageUrl,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Center(
                          child: Icon(Icons.image_outlined,
                              color: Colors.black26, size: 40),
                        ),
                      ),
                    if (promo != null && promo.label.isNotEmpty)
                      Align(
                        alignment: Alignment.topLeft,
                        child: Container(
                          margin: const EdgeInsets.all(8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: kPrimaryBlue.withOpacity(.95),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Text(
                            promo.label,
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
                    if (promo?.endAt != null)
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
                            'Kết thúc: ${df.format(promo!.endAt!)}',
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
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: kPrimaryBlue.withOpacity(.12),
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Text(
                          'Mã #${product.id}',
                          style: const TextStyle(
                            color: kPrimaryBlue,
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
                            color: kPrimaryBlue.withOpacity(.7),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Đã bán: $soldLabel',
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
                  Row(
                    children: [
                      if (percent != null && percent > 0) ...[
                        Text(
                          formatPrice(basePrice),
                          style: const TextStyle(
                            fontSize: 12,
                            color: kPrimaryBlue,
                            decoration: TextDecoration.lineThrough,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 6),
                      ],
                      Text(
                        formatPrice(finalPrice),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.red,
                        ),
                      ),
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

  Future<void> _openChat() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      final goLogin = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Cần đăng nhập'),
          content: const Text('Bạn cần đăng nhập để trao đổi với nhân viên.'),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Để sau')),
            ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Đăng nhập')),
          ],
        ),
      );
      if (goLogin == true && mounted) {
        await Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => const LoginScreen()));
      }
      return;
    }
    if (!mounted) return;
    try {
      final svc = ChatService();
      final box = await svc.startChat();
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) =>
              ChatScreen(chatBox: box, product: _fullProduct ?? widget.product),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Lỗi'),
          content: Text('Không thể mở chat: $e'),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Đóng'))
          ],
        ),
      );
    }
  }

  Widget _buildReviewsSection() {
    final avgRating = _reviews.isEmpty
        ? 0.0
        : _reviews.fold<int>(0, (sum, r) => sum + r.rating) / _reviews.length;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.grey[200]!),
          bottom: BorderSide(color: Colors.grey[200]!),
        ),
      ),
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Đánh giá sản phẩm',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              Row(
                children: [
                  const Icon(Icons.star, color: Colors.amber, size: 20),
                  const SizedBox(width: 4),
                  Text(
                    '${avgRating.toStringAsFixed(1)} (${_reviews.length})',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 16),

          ..._reviews.take(3).map((review) => _buildReviewCard(review)),

          if (_reviews.isNotEmpty)
            Center(
              child: TextButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProductReviewsScreen(
                        productId: widget.product.id,
                        productName: widget.product.name,
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.arrow_forward, size: 16),
                label: Text('Xem tất cả ${_reviews.length} đánh giá'),
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFFEE4D2D),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildReviewCard(Review review) {
    final dateFormat = DateFormat('dd/MM/yyyy');
    final imageUrls = review.imageList;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey[100]!),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: Colors.grey[300],
                backgroundImage: review.customerImage != null &&
                        review.customerImage!.isNotEmpty
                    ? NetworkImage(review.customerImage!)
                    : null,
                child: review.customerImage == null ||
                        review.customerImage!.isEmpty
                    ? Text(
                        review.customerName?.substring(0, 1).toUpperCase() ??
                            'U',
                        style:
                            const TextStyle(color: Colors.white, fontSize: 14),
                      )
                    : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      (review.customerName != null &&
                              review.customerName!.trim().isNotEmpty)
                          ? review.customerName!.trim()
                          : 'KH #${review.customerId}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    if (review.reviewDate != null)
                      Text(
                        dateFormat.format(review.reviewDate!),
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          if (review.productName != null || review.productImage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: (review.variantImage ?? review.productImage) != null
                        ? Image.network(
                            (review.variantImage ?? review.productImage)!,
                            width: 54,
                            height: 54,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              width: 54,
                              height: 54,
                              color: Colors.grey[200],
                              child: const Icon(Icons.broken_image,
                                  size: 24, color: Colors.grey),
                            ),
                          )
                        : Container(
                            width: 54,
                            height: 54,
                            color: Colors.grey[200],
                            child: const Icon(Icons.image_not_supported,
                                size: 24, color: Colors.grey),
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      review.productName ?? 'Sản phẩm',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        height: 1.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          Row(
            children: List.generate(5, (index) {
              return Icon(
                index < review.rating ? Icons.star : Icons.star_border,
                color: Colors.amber,
                size: 16,
              );
            }),
          ),

          if (review.variantSize != null || review.variantColor != null) ...[
            const SizedBox(height: 6),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Phân loại hàng:',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      if (review.variantColor != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Màu: ${review.variantColor}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[700],
                            ),
                          ),
                        ),
                      if (review.variantSize != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Size: ${review.variantSize}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[700],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ],

          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              review.comment!,
              style: const TextStyle(
                fontSize: 13,
                color: Colors.black87,
                height: 1.3,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],

          if (imageUrls.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: imageUrls.take(3).map((url) {
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: Image.network(
                      url,
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 60,
                        height: 60,
                        color: Colors.grey[200],
                        child: const Icon(Icons.broken_image,
                            size: 24, color: Colors.grey),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],

          if (review.shopReply != null && review.shopReply!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.store, size: 18, color: Colors.orange),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Phản hồi từ Shop',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          review.shopReply!,
                          style: const TextStyle(
                            fontSize: 13,
                            height: 1.4,
                            color: Colors.black87,
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
}

