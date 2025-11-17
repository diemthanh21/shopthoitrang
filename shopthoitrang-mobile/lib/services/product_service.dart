import '../services/api_client.dart';
import '../models/product_model.dart';
import 'dart:async';
import 'dart:math' as math;

class ProductService {
  final ApiClient _api;
  String? _token;

  ProductService(this._api, {String? token}) : _token = token;

  void setToken(String? token) => _token = token;

  Map<String, String> _headers() => {
        'Content-Type': 'application/json',
        if (_token != null && _token!.isNotEmpty)
          'Authorization': 'Bearer $_token',
      };

  // ---------------- COUNT (tổng số sản phẩm) ----------------

  Future<int> countProducts({
    String? categoryName,
    double? minPrice,
    double? maxPrice,
    bool onlyFiveStar = false,
  }) async {
    try {
      final hasFilter = (categoryName?.trim().isNotEmpty ?? false) ||
          (minPrice != null) ||
          (maxPrice != null) ||
          onlyFiveStar;

      if (hasFilter) {
        // 1) Thử endpoint count của catalog
        try {
          final q = <String, String>{
            if (categoryName != null && categoryName.trim().isNotEmpty)
              'categoryName': categoryName.trim(),
            if (minPrice != null) 'minPrice': minPrice.toStringAsFixed(0),
            if (maxPrice != null) 'maxPrice': maxPrice.toStringAsFixed(0),
            if (onlyFiveStar) 'onlyFiveStar': 'true',
          };
          final json = await _api.get('/catalog/products/count',
              headers: _headers(), query: q);
          final n =
              json['total'] ?? json['count'] ?? (json['data']?['count']) ?? 0;
          final v = n is int ? n : int.tryParse('$n') ?? 0;
          if (v > 0) return v;
        } catch (_) {
          // bỏ qua, thử fallback đếm client
        }

        // 2) Fallback: gọi /catalog/products rồi đếm client
        final q2 = <String, String>{
          if (categoryName != null && categoryName.trim().isNotEmpty)
            'categoryName': categoryName.trim(),
          if (minPrice != null) 'minPrice': minPrice.toStringAsFixed(0),
          if (maxPrice != null) 'maxPrice': maxPrice.toStringAsFixed(0),
          if (onlyFiveStar) 'onlyFiveStar': 'true',
        };
        final res =
            await _api.get('/catalog/products', headers: _headers(), query: q2);
        final dynamic body = _extractList(res);
        return body.length;
      } else {
        // Không có filter -> sanpham/count
        try {
          final json = await _api.get('/sanpham/count', headers: _headers());
          final n =
              json['total'] ?? json['count'] ?? (json['data']?['count']) ?? 0;
          return n is int ? n : int.tryParse('$n') ?? 0;
        } catch (_) {
          // fallback: gọi /sanpham và đếm
          final res = await _api.get('/sanpham', headers: _headers());
          final dynamic body = _extractList(res);
          return body.length;
        }
      }
    } catch (_) {
      return 0;
    }
  }

  // ---------------- LIST + ENRICH ----------------

  Future<List<Product>> listWithImages({
    int? limit,
    int? offset,
    String? keyword, // nếu backend dùng, bạn có thể map sang q
    int concurrency = 2,

    // FILTER/SORT:
    String? categoryName,
    double? minPrice,
    double? maxPrice,
    bool onlyFiveStar = false,
    String? orderBy, // 'category' | 'price' | 'rating'
    bool sortDesc = false,

    // ép dùng catalog (kể cả không filter)
    bool forceCatalog = false,
  }) async {
    final hasFilter = forceCatalog ||
        (categoryName?.trim().isNotEmpty ?? false) ||
        (minPrice != null) ||
        (maxPrice != null) ||
        onlyFiveStar ||
        (orderBy != null);

    // ---------------- 1) Lấy danh sách "thô" ----------------
    List<Map<String, dynamic>> raw;

    if (hasFilter) {
      final q = <String, String>{
        if (categoryName != null && categoryName.trim().isNotEmpty)
          'categoryName': categoryName.trim(),
        if (minPrice != null) 'minPrice': minPrice.toStringAsFixed(0),
        if (maxPrice != null) 'maxPrice': maxPrice.toStringAsFixed(0),
        if (onlyFiveStar) 'onlyFiveStar': 'true',
        if (orderBy != null) 'orderBy': orderBy,
        'sort': sortDesc ? 'desc' : 'asc',
        if (keyword != null && keyword.isNotEmpty) 'q': keyword,
        if (limit != null && limit > 0) 'limit': '$limit',
        if (offset != null && offset >= 0) 'offset': '$offset',
      };

      try {
        final res =
            await _api.get('/catalog/products', headers: _headers(), query: q);
        raw = _extractList(res);
      } on ApiException catch (e) {
        if (e.statusCode == 404) {
          final res = await _api.get('/sanpham', headers: _headers());
          raw = _extractList(res);
        } else {
          rethrow;
        }
      }
    } else {
      final q = <String, String>{
        if (keyword != null && keyword.isNotEmpty) 'q': keyword,
        if (limit != null && limit > 0) 'limit': '$limit',
        if (offset != null && offset >= 0) 'offset': '$offset',
        'orderBy': 'masanpham,asc',
        'order': 'masanpham.asc',
      };

      final res = await _api.get('/sanpham', headers: _headers(), query: q);
      raw = _extractList(res);

      raw.sort((a, b) =>
          _cmpId(a['masanpham'] ?? a['id'], b['masanpham'] ?? b['id']));
    }

    // ---------------- 2) Loc bo san pham da ngung ban ----------------
    final filtered = raw.where(_isProductActive).toList();
    if (filtered.isEmpty) return [];

    // ---------------- 3) Phan trang client-side (fallback) ----------------
    final start = math.max(0, (offset ?? 0));
    final lim = (limit == null || limit <= 0) ? filtered.length : limit;
    final end = math.min(filtered.length, start + lim);
    if (start >= filtered.length) return [];

    final pageSlice = filtered.sublist(start, end);

    // ---------------- 4) Enrich chi tiết + ảnh (giữ thứ tự) ----------------
    final enriched =
        await enrichProductsFromRawList(pageSlice, concurrency: concurrency);
    return enriched;
  }

  Future<Product?> getByIdWithImages(int id, {int concurrency = 5}) async {
    dynamic sp;
    try {
      final res = await _api.get('/sanpham/$id', headers: _headers());
      sp = (res['data'] is Map) ? res['data'] : res;
    } catch (_) {
      final res = await _api.get('/sanpham',
          headers: _headers(), query: {'masanpham': '$id', 'limit': '1'});
      final list = (res['data'] is List) ? res['data'] : res;
      if (list is List && list.isNotEmpty) sp = list.first;
    }

    if (sp is! Map) return null;

    final ctJson = await _api.get('/chitietsanpham',
        headers: _headers(), query: {'masanpham': '$id'});

    dynamic ctListAny;
    if (ctJson['items'] is List) {
      ctListAny = ctJson['items'];
    } else if (ctJson['data'] is List) {
      ctListAny = ctJson['data'];
    } else {
      ctListAny = const [];
    }
    final ctList = (ctListAny as List).cast<Map>();

    final enriched = <Map<String, dynamic>>[];
    for (final ct in ctList) {
      final mactsp = ct['machitietsanpham'] ?? ct['id'];
      try {
        final haJson = await _api.get('/hinhanhsanpham/sanpham/$mactsp',
            headers: _headers());
        final dynamic haListAny =
            (haJson['data'] is List) ? haJson['data'] : haJson['items'];
        final haList = haListAny is List ? haListAny.cast<Map>() : <Map>[];

        final ctClone = Map<String, dynamic>.from(ct as Map<String, dynamic>);
        ctClone['hinhanhsanpham'] = haList
            .map((h) => {
                  'duongdanhinhanh': h['duongdanhinhanh'] ?? h['url'] ?? '',
                })
            .toList();
        enriched.add(ctClone);
      } catch (_) {
        final ctClone = Map<String, dynamic>.from(ct as Map<String, dynamic>);
        ctClone['hinhanhsanpham'] = const [];
        enriched.add(ctClone);
      }
    }

    final spClone = Map<String, dynamic>.from(sp as Map<String, dynamic>);
    spClone['chitietsanpham'] = enriched;
    return Product.fromJson(spClone);
  }

  /// Enrich từ danh sách sản phẩm thô (đã có từ catalog/sanpham),
  /// bổ sung chitietsanpham & hinhanhsanpham, GIỮ THỨ TỰ.
  Future<List<Product>> enrichProductsFromRawList(
    List<Map<String, dynamic>> rawList, {
    int concurrency = 2,
  }) async {
    final results = List<Map<String, dynamic>?>.filled(rawList.length, null,
        growable: false);

    int running = 0;
    final queue = <Future<void> Function()>[];
    final done = Completer<void>();

    void _pump() {
      while (running < concurrency && queue.isNotEmpty) {
        final job = queue.removeAt(0);
        running++;
        job().whenComplete(() {
          running--;
          if (queue.isEmpty && running == 0 && !done.isCompleted) {
            done.complete();
          } else {
            _pump();
          }
        });
      }
    }

    for (var i = 0; i < rawList.length; i++) {
      final sp = rawList[i];
      queue.add(() async {
        final masp = sp['masanpham'] ?? sp['id'];

        final ctJson = await _safeGet(
          '/chitietsanpham',
          headers: _headers(),
          query: {'masanpham': '$masp'},
        );

        final dynamic ctListAny =
            (ctJson['items'] is List) ? ctJson['items'] : ctJson['data'];
        final ctList = (ctListAny is List) ? ctListAny.cast<Map>() : <Map>[];

        final enrichedCT = <Map<String, dynamic>>[];
        for (final ct in ctList) {
          final mactsp = ct['machitietsanpham'] ?? ct['id'];
          try {
            final haJson = await _safeGet(
              '/hinhanhsanpham/sanpham/$mactsp',
              headers: _headers(),
            );
            final dynamic haListAny = haJson['data'];
            final haList =
                (haListAny is List) ? haListAny.cast<Map>() : <Map>[];

            final ctClone =
                Map<String, dynamic>.from(ct as Map<String, dynamic>);
            ctClone['hinhanhsanpham'] = haList
                .map((h) => {
                      'duongdanhinhanh': h['duongdanhinhanh'] ?? h['url'] ?? '',
                    })
                .toList();
            enrichedCT.add(ctClone);
          } catch (_) {
            final ctClone =
                Map<String, dynamic>.from(ct as Map<String, dynamic>);
            ctClone['hinhanhsanpham'] = const [];
            enrichedCT.add(ctClone);
          }
        }

        final spClone = Map<String, dynamic>.from(sp);
        spClone['chitietsanpham'] = enrichedCT;
        results[i] = spClone;
      });
    }

    _pump();
    await done.future;

    return results
        .whereType<Map<String, dynamic>>()
        .map(Product.fromJson)
        .toList();
  }

  // ---------------- Helpers chung ----------------

  Future<Map<String, dynamic>> _safeGet(
    String path, {
    Map<String, String>? headers,
    Map<String, String>? query,
    int retries = 2,
  }) async {
    int attempt = 0;
    while (true) {
      try {
        return await _api.get(path, headers: headers, query: query);
      } catch (e) {
        attempt++;
        if (attempt > retries) rethrow;
        await Future.delayed(Duration(milliseconds: 200 * attempt));
      }
    }
  }

  List<Map<String, dynamic>> _extractList(dynamic res) {
    final dynamic body = (res['data'] is List)
        ? res['data']
        : (res['items'] is List)
            ? res['items']
            : res;
    final list = body is List ? body : const [];
    return list
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  bool _isProductActive(Map<String, dynamic> raw) {
    final status =
        raw['trangthai'] ?? raw['trangThai'] ?? raw['status'] ?? raw['state'];
    if (status == null) return true;
    if (status is bool) return status;
    final value = status.toString().trim().toLowerCase();
    if (value.isEmpty) return true;

    const inactiveKeywords = {
      'ngung ban',
      'ngung kinh doanh',
      'nghi ban',
      'dung ban',
      'nghi kinh doanh',
      '0',
      'false',
      'inactive',
      'off',
    };
    return !inactiveKeywords.contains(value);
  }

  int _cmpId(dynamic a, dynamic b) {
    final ai = a?.toString() ?? '';
    final bi = b?.toString() ?? '';
    final aiNum = int.tryParse(ai);
    final biNum = int.tryParse(bi);
    if (aiNum != null && biNum != null) return aiNum.compareTo(biNum);
    return ai.compareTo(bi);
  }

  DateTime? _parseDateTime(dynamic v) {
    if (v == null) return null;
    if (v is DateTime) return v;
    final s = v.toString();
    if (s.isEmpty) return null;
    return DateTime.tryParse(s);
  }

  List<int> _promotionProductIds(Map<String, dynamic> j) {
    final ids = <int>{};

    final single = j['masanpham'] ?? j['maSanPham'];
    if (single != null) {
      final v = int.tryParse(single.toString());
      if (v != null) ids.add(v);
    }

    final multi = j['sanpham_apdung_ids'] ?? j['sanPhamApDungIds'];
    if (multi != null) {
      final parts = multi.toString().split(RegExp(r'[,\s]+'));
      for (final p in parts) {
        final v = int.tryParse(p.trim());
        if (v != null) ids.add(v);
      }
    }

    return ids.toList();
  }

  bool _promotionIsActive(Map<String, dynamic> j, DateTime now) {
    final start = _parseDateTime(j['ngaybatdau'] ?? j['ngayBatDau']);
    final end = _parseDateTime(j['ngayketthuc'] ?? j['ngayKetThuc']);
    if (start == null || end == null) return false;

    // end là DATE nên cho kết thúc tới cuối ngày
    final endInclusive = DateTime(end.year, end.month, end.day, 23, 59, 59);

    final inRange = !now.isBefore(start) &&
        !now.isAfter(endInclusive); // start <= now <= end

    // thêm cờ is_active của loại khuyến mãi (nếu có)
    final typeRow = j['loaikhuyenmai'];
    bool? activeFlag;
    if (typeRow is Map<String, dynamic>) {
      final raw = typeRow['is_active'];
      if (raw is bool) activeFlag = raw;
    }
    final selfFlag = j['is_active'];
    if (selfFlag is bool) activeFlag = selfFlag;

    if (activeFlag == null) {
      return inRange;
    }
    return inRange && activeFlag;
  }

  /// Lấy map khuyến mãi *đang diễn ra* cho list sản phẩm.
  /// key: masanpham, value: ProductPromotion (chỉ lấy 1 khuyến mãi ưu tiên đầu tiên).
  Future<Map<int, ProductPromotion>> getActivePromotionsForProducts(
      List<int> productIds) async {
    if (productIds.isEmpty) return {};

    final res = await _api.get('/khuyenmai', headers: _headers());
    final list = _extractList(res);
    final now = DateTime.now();

    final map = <int, ProductPromotion>{};

    for (final row in list) {
      if (!_promotionIsActive(row, now)) continue;

      final ids = _promotionProductIds(row);
      if (ids.isEmpty) continue;

      final promo = ProductPromotion.fromJson(row);

      for (final pid in ids) {
        if (!productIds.contains(pid)) continue;
        // nếu 1 sản phẩm có nhiều CTKM, mình giữ CTKM đầu tiên
        map.putIfAbsent(pid, () => promo);
      }
    }

    return map;
  }

  Future<Map<int, ProductStats>> productsStats(List<int> ids) async {
    final Map<int, ProductStats> result = {};
    for (final id in ids) {
      try {
        final stats = await getStats(id);
        result[id] = stats;
      } catch (_) {
        // ignore single failures to avoid blocking whole list
      }
    }
    return result;
  }
}

// ---------------- Các tiện ích khác ----------------

/// Pair dữ liệu: Product + biến thể cụ thể, phục vụ màn hình đơn hàng
class ProductWithVariant {
  final Product product;
  final ProductVariant variant;
  ProductWithVariant({required this.product, required this.variant});
}

extension ProductServiceExtras on ProductService {
  Future<ProductWithVariant?> getProductWithVariantByVariantId(
      int variantId) async {
    try {
      print('🔍 Fetching variant details for variantId: $variantId');

      Map<String, dynamic>? ctData;
      try {
        final ctRes = await _safeGet(
          '/chitietsanpham/$variantId',
          headers: _headers(),
        );
        if (ctRes['machitietsanpham'] != null || ctRes['id'] != null) {
          ctData = ctRes;
        } else if (ctRes['data'] is Map) {
          ctData = ctRes['data'] as Map<String, dynamic>;
        }
      } catch (_) {}

      if (ctData == null) {
        final ctRes = await _safeGet(
          '/chitietsanpham',
          headers: _headers(),
          query: {'machitietsanpham': '$variantId'},
        );

        List ctList;
        if (ctRes['items'] is List) {
          ctList = ctRes['items'] as List;
        } else if (ctRes['data'] is List) {
          ctList = ctRes['data'] as List;
        } else {
          ctList = const [];
        }

        print(
            '📦 Query returned ${ctList.length} records for variantId $variantId');

        if (ctList.isEmpty) {
          print('❌ No variant found for variantId: $variantId');
          return null;
        }

        final matchingRecords = ctList.where((item) {
          final id = item['machitietsanpham'] ?? item['id'];
          return id == variantId || id.toString() == variantId.toString();
        }).toList();

        if (matchingRecords.isEmpty) {
          print(
              '⚠️ No matching record for variantId $variantId in result list');
          return null;
        }

        ctData = matchingRecords.first as Map<String, dynamic>;
        print('✅ Found matching variant: ${ctData['machitietsanpham']}');
      }

      final masp = ctData['masanpham'] ?? ctData['productId'];
      if (masp == null) {
        print('❌ No masanpham found in variant data for variantId: $variantId');
        return null;
      }

      print('📦 Product ID for variant $variantId: $masp');

      final product = await getByIdWithImages(int.tryParse('$masp') ?? masp);
      if (product == null) {
        print('❌ Product not found for masanpham: $masp');
        return null;
      }

      print(
          '✅ Product loaded: ${product.name} with ${product.variants.length} variants');

      final variant = product.variants.firstWhere(
        (v) => v.id == variantId,
        orElse: () {
          print(
              '⚠️ Variant $variantId not found in product variants, using first');
          return product.variants.isNotEmpty
              ? product.variants.first
              : ProductVariant(
                  id: variantId, productId: product.id, price: 0, stock: 0);
        },
      );

      print('✅ Variant matched: ${variant.id} - ${variant.displayName}');

      return ProductWithVariant(product: product, variant: variant);
    } catch (e) {
      print('❌ Error fetching variant $variantId: $e');
      return null;
    }
  }

  Future<ProductStats> getStats(int productId) async {
    final res =
        await _api.get('/sanpham/$productId/stats', headers: _headers());
    final payload = res['data'] is Map<String, dynamic> ? res['data'] : res;
    return ProductStats.fromJson(payload);
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
    int parseInt(dynamic value) => value is num
        ? value.toInt()
        : int.tryParse(value?.toString() ?? '0') ?? 0;

    final source = json['data'] is Map<String, dynamic> ? json['data'] : json;
    return ProductStats(
      sold: parseInt(source['sold'] ?? source['soldQuantity']),
      stock: parseInt(source['stock'] ?? source['currentStock']),
    );
  }
}

/// Model khuyến mãi cho mobile
class ProductPromotion {
  final int id; // makhuyenmai
  final String name; // tenchuongtrinh
  final String typeName; // loaikhuyenmai.tenloai
  final double? discountPercent; // tylegiam
  final DateTime? start;
  final DateTime? end;

  ProductPromotion({
    required this.id,
    required this.name,
    required this.typeName,
    this.discountPercent,
    this.start,
    this.end,
  });

  factory ProductPromotion.fromJson(Map<String, dynamic> json) {
    final typeRow =
        (json['loaikhuyenmai'] is Map) ? json['loaikhuyenmai'] as Map : null;
    final rawTypeString = (json['loaikhuyenmai'] is String
            ? json['loaikhuyenmai']
            : json['loaiKhuyenMai'])
        ?.toString();

    double? parseDouble(dynamic v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '');
    }

    DateTime? parseDate(dynamic v) {
      if (v == null) return null;
      if (v is DateTime) return v;
      return DateTime.tryParse(v.toString());
    }

    String typeLabel = (typeRow?['tenloai'] ?? typeRow?['tenLoai'] ?? '')
        .toString()
        .trim();
    if (typeLabel.isEmpty && rawTypeString != null) {
      typeLabel = rawTypeString == 'GIAM_PERCENT'
          ? 'Giảm %'
          : rawTypeString == 'TANG'
              ? 'Tặng'
              : rawTypeString;
    }

    return ProductPromotion(
      id: json['makhuyenmai'] ?? json['id'] ?? 0,
      name: (json['tenchuongtrinh'] ?? json['tenChuongTrinh'] ?? '').toString(),
      typeName: typeLabel.isNotEmpty
          ? typeLabel
          : (json['tenLoai'] ?? json['loai'] ?? '').toString(),
      discountPercent: parseDouble(json['tylegiam']),
      start: parseDate(json['ngaybatdau'] ?? json['ngayBatDau']),
      end: parseDate(json['ngayketthuc'] ?? json['ngayKetThuc']),
    );
  }

  /// Text nhỏ màu đỏ để hiển thị dưới giá
  String get displayLabel {
    if (typeName.isNotEmpty) return typeName;
    if (discountPercent != null && discountPercent! > 0) {
      final v = discountPercent!;
      final str = v % 1 == 0 ? v.toStringAsFixed(0) : v.toStringAsFixed(1);
      return 'Giảm $str%';
    }
    return name;
  }

  /// Text thời gian kết thúc: "Kết thúc: dd/MM/yyyy HH:mm"
  String get displayEndTime {
    if (end == null) return '';
    final d = end!;
    final dd = d.day.toString().padLeft(2, '0');
    final mm = d.month.toString().padLeft(2, '0');
    final yyyy = d.year.toString();
    // DB là DATE nên giả định kết thúc 23:59
    const hh = '23';
    const mn = '59';
    return 'Kết thúc: $dd/$mm/$yyyy $hh:$mn';
  }
}
