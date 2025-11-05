class ProductImage {
  final String url;
  ProductImage({required this.url});

  factory ProductImage.fromJson(Map<String, dynamic> j) => ProductImage(
        url: (j['duongdanhinhanh'] ?? j['duongDanHinhAnh'] ?? j['url'] ?? '')
            .toString(),
      );
}

class ProductVariant {
  final int id; // machitietsanpham
  final int productId; // masanpham
  final String? size; // kichthuoc
  final String? color; // mausac
  final String? material; // chatlieu
  final String? desc; // mota
  final double price; // giaban
  final int stock; // soluongton
  final List<ProductImage> images;

  ProductVariant({
    required this.id,
    required this.productId,
    required this.price,
    required this.stock,
    this.size,
    this.color,
    this.material,
    this.desc,
    this.images = const [],
  });

  factory ProductVariant.fromJson(Map<String, dynamic> j) => ProductVariant(
        id: j['machitietsanpham'] ?? j['id'] ?? 0,
        productId: j['masanpham'] ?? 0,
        size: j['kichthuoc']?.toString(),
        color: j['mausac']?.toString(),
        material: j['chatlieu']?.toString(),
        desc: j['mota']?.toString(),
        price: (j['giaban'] is num) ? (j['giaban'] as num).toDouble() : 0,
        stock: (j['soluongton'] is num) ? (j['soluongton'] as num).toInt() : 0,
        // Supabase embed: hinhanhsanpham is a List
        images: ((j['hinhanhsanpham'] as List?) ?? [])
            .map((e) => ProductImage.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  String get displayName {
    final parts = <String>[];
    if (color != null && color!.isNotEmpty) parts.add(color!);
    if (size != null && size!.isNotEmpty) parts.add('Size $size');
    return parts.isEmpty ? 'Mặc định' : parts.join(' - ');
  }
}

class Product {
  final int id; // masanpham
  final String name; // tensanpham
  final int? categoryId; // madanhmuc
  final int? brandId; // mathuonghieu
  final String? status; // trangthai
  final List<ProductVariant> variants;

  Product({
    required this.id,
    required this.name,
    this.categoryId,
    this.brandId,
    this.status,
    this.variants = const [],
  });

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['masanpham'] ?? j['id'],
        name: j['tensanpham'] ?? j['ten'] ?? '',
        categoryId: j['madanhmuc'],
        brandId: j['mathuonghieu'],
        status: j['trangthai'],
        // Supabase embed: chitietsanpham is a List
        variants: ((j['chitietsanpham'] as List?) ?? [])
            .map((e) => ProductVariant.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  // ===== helpers cho UI =====
  List<ProductImage> get allImages => variants.expand((v) => v.images).toList();

  double? get minPrice => variants.isEmpty
      ? null
      : variants.map((v) => v.price).reduce((a, b) => a < b ? a : b);

  /// Danh sách URL ảnh (unique, loại bỏ rỗng) dùng cho gallery / slider.
  List<String> galleryImageUrls({bool shuffle = false}) {
    final set = <String>{};
    for (final v in variants) {
      for (final img in v.images) {
        final u = img.url.trim();
        if (u.isNotEmpty) set.add(u);
      }
    }
    final list = set.toList();
    if (shuffle && list.length > 1) {
      list.shuffle();
    }
    return list;
  }
}
