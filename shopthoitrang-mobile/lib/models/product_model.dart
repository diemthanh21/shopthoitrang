class ProductImage {
  final String url;
  ProductImage({required this.url});

  factory ProductImage.fromJson(Map<String, dynamic> j) => ProductImage(
        url: (j['duongdanhinhanh'] ??
                j['duongDanHinhAnh'] ??
                j['url'] ??
                '')
            .toString(),
      );
}

class VariantSize {
  final int? id; // id bảng nối
  final int? sizeId; // makichthuoc
  final String name;
  final String? description;
  final int stock;
  final double extraPrice;

  const VariantSize({
    required this.id,
    required this.sizeId,
    required this.name,
    this.description,
    this.stock = 0,
    this.extraPrice = 0,
  });

  factory VariantSize.fromJson(Map<String, dynamic> json) {
    final sizeRow =
        (json['kichthuocs'] as Map<String, dynamic>?) ?? const {};
    final rawName = json['tenKichThuoc'] ??
        json['ten_kichthuoc'] ??
        sizeRow['ten_kichthuoc'] ??
        '';
    final stockValue = json['soLuong'] ?? json['so_luong'] ?? 0;

    return VariantSize(
      id: json['id'] ??
          json['machitietsanpham_kichthuoc'] ??
          json['bridgeId'],
      sizeId:
          json['makichthuoc'] ?? json['maKichThuoc'] ?? sizeRow['makichthuoc'],
      name: rawName?.toString() ?? '',
      description: (json['moTa'] ?? json['mo_ta'] ?? sizeRow['mo_ta'])
          ?.toString(),
      stock: stockValue is num
          ? stockValue.toInt()
          : int.tryParse('$stockValue') ?? 0,
      extraPrice: (json['giaThem'] is num)
          ? (json['giaThem'] as num).toDouble()
          : (json['gia_them'] is num)
              ? (json['gia_them'] as num).toDouble()
              : double.tryParse(
                      '${json['giaThem'] ?? json['gia_them'] ?? 0}') ??
                  0,
    );
  }
}

List<Map<String, dynamic>> _pickSizeMaps(Map<String, dynamic> json) {
  final direct = json['sizes'];
  if (direct is List && direct.isNotEmpty) {
    return direct.whereType<Map<String, dynamic>>().toList();
  }
  final bridge = json['chitietsanpham_kichthuoc'];
  if (bridge is List && bridge.isNotEmpty) {
    return bridge.whereType<Map<String, dynamic>>().toList();
  }
  return const [];
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
  final List<VariantSize> sizes;

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
    this.sizes = const [],
  });

  factory ProductVariant.fromJson(Map<String, dynamic> j) {
    final rawSizeMaps = _pickSizeMaps(j);
    final parsedSizes =
        rawSizeMaps.map((e) => VariantSize.fromJson(e)).toList();
    final fallbackSize = j['kichthuoc']?.toString() ??
        (parsedSizes.isNotEmpty ? parsedSizes.first.name : null);

    return ProductVariant(
      id: j['machitietsanpham'] ?? j['id'] ?? 0,
      productId: j['masanpham'] ?? 0,
      size: fallbackSize,
      color: j['mausac']?.toString(),
      material: j['chatlieu']?.toString(),
      desc: j['mota']?.toString(),
      price: (j['giaban'] is num) ? (j['giaban'] as num).toDouble() : 0,
      stock:
          (j['soluongton'] is num) ? (j['soluongton'] as num).toInt() : 0,
      images: ((j['hinhanhsanpham'] as List?) ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ProductImage.fromJson)
          .toList(),
      sizes: parsedSizes,
    );
  }

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
  final String? categoryName; // tendanhmuc (join từ bảng danh mục)
  final int? brandId; // mathuonghieu
  final String? status; // trangthai
  final String? coverImage; // hinhanh cover
  final String? sizeChartUrl; // bangsize
  final List<ProductVariant> variants;

  Product({
    required this.id,
    required this.name,
    this.categoryId,
    this.categoryName,
    this.brandId,
    this.status,
    this.coverImage,
    this.sizeChartUrl,
    this.variants = const [],
  });

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['masanpham'] ?? j['id'],
        name: j['tensanpham'] ?? j['ten'] ?? '',
        categoryId: j['madanhmuc'],
        categoryName: j['tendanhmuc'] ??
            j['tenDanhMuc'] ??
            j['categoryName'] ??
            j['ten_danh_muc'],
        brandId: j['mathuonghieu'],
        status: j['trangthai'],
        coverImage: j['hinhanh']?.toString(),
        sizeChartUrl:
            j['bangsize']?.toString() ?? j['bangSize']?.toString(),
        // Supabase embed: chitietsanpham is a List
        variants: ((j['chitietsanpham'] as List?) ?? [])
            .whereType<Map<String, dynamic>>()
            .map(ProductVariant.fromJson)
            .toList(),
      );

  // ===== helpers cho UI =====
  List<ProductImage> get allImages =>
      variants.expand((v) => v.images).toList();

  double? get minPrice => variants.isEmpty
      ? null
      : variants
          .map((v) => v.price)
          .reduce((a, b) => a < b ? a : b);

  /// Danh sách URL ảnh (unique, loại bỏ rỗng) dùng cho gallery / slider.
  List<String> galleryImageUrls({bool shuffle = false}) {
    final seen = <String>{};
    final ordered = <String>[];

    void addUrl(String? url) {
      final value = url?.trim();
      if (value == null || value.isEmpty) return;
      if (seen.add(value)) {
        ordered.add(value);
      }
    }

    addUrl(coverImage);
    for (final v in variants) {
      for (final img in v.images) {
        addUrl(img.url);
      }
    }

    if (shuffle && ordered.length > 1) {
      final head = ordered.first;
      final rest = ordered.sublist(1);
      rest.shuffle();
      return [head, ...rest];
    }

    return ordered;
  }
}

class ProductStats {
  final int sold;
  final int stock;

  ProductStats({
    required this.sold,
    required this.stock,
  });

  factory ProductStats.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value) =>
        value is num ? value.toInt() : int.tryParse(value?.toString() ?? '0') ?? 0;

    final source = json['data'] is Map<String, dynamic> ? json['data'] : json;
    return ProductStats(
      sold: parseInt(source['sold'] ?? source['soldQuantity']),
      stock: parseInt(source['stock'] ?? source['currentStock']),
    );
  }
}
