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

  /// Đếm tổng số sản phẩm theo bộ lọc (nếu có).
  /// Ưu tiên dùng /catalog/products/count khi có filter, nếu không có thì /sanpham/count.
  /// Nếu backend chưa có endpoint count, fallback gọi danh sách và đếm client.
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
          // không truyền limit/offset để lấy full (server nên giới hạn an toàn)
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

  /// Trả về list<Product> theo:
  /// - Nếu có filter/sort: gọi /catalog/products
  /// - Nếu không: gọi /sanpham (giữ order ổn định)
  /// Luôn có fallback phân trang client-side để tránh lặp/trùng khi server không áp dụng limit/offset.
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
      // Dùng endpoint catalog của bạn (có fallback nếu 404)
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
      // Dùng endpoint sanpham (không filter)
      final q = <String, String>{
        if (keyword != null && keyword.isNotEmpty) 'q': keyword,
        if (limit != null && limit > 0) 'limit': '$limit',
        if (offset != null && offset >= 0) 'offset': '$offset',
        'orderBy': 'masanpham,asc', // gợi ý server sort
        'order': 'masanpham.asc', // fallback format khác
      };

      final res = await _api.get('/sanpham', headers: _headers(), query: q);
      raw = _extractList(res);

      // Sort ổn định tại client (phòng khi server không sort)
      raw.sort((a, b) =>
          _cmpId(a['masanpham'] ?? a['id'], b['masanpham'] ?? b['id']));
    }

    // ---------------- 2) Phân trang client-side (fallback) ----------------
    // Nếu server không áp limit/offset, ta vẫn cắt cửa sổ dữ liệu tại client.
    final start = math.max(0, (offset ?? 0));
    final lim = (limit == null || limit <= 0) ? raw.length : limit;
    final end = math.min(raw.length, start + lim);
    if (start >= raw.length) return [];

    final pageSlice = raw.sublist(start, end);

    // ---------------- 3) Enrich chi tiết + ảnh (giữ thứ tự) ----------------
    final enriched =
        await enrichProductsFromRawList(pageSlice, concurrency: concurrency);
    return enriched;
  }
  Future<Product?> getByIdWithImages(int id, {int concurrency = 5}) async {
  // 1) Lấy bản ghi sản phẩm theo ID (ưu tiên /sanpham/:id)
  dynamic sp;
  try {
    final res = await _api.get('/sanpham/$id', headers: _headers());
    // server có thể trả {data:{...}} hoặc {...}
    sp = (res is Map && res['data'] is Map) ? res['data'] : res;
  } catch (_) {
    // fallback nếu server không có /:id → dùng query theo khóa chính
    final res = await _api.get('/sanpham',
        headers: _headers(), query: {'masanpham': '$id', 'limit': '1'});
    final list = (res is Map && res['data'] is List) ? res['data'] : res;
    if (list is List && list.isNotEmpty) sp = list.first;
  }

  if (sp is! Map) return null;

  // 2) Lấy chi tiết
  final ctJson = await _api.get('/chitietsanpham',
      headers: _headers(), query: {'masanpham': '$id'});

  dynamic ctListAny;
  if (ctJson is Map && ctJson['items'] is List) {
    ctListAny = ctJson['items'];
  } else if (ctJson is Map && ctJson['data'] is List) {
    ctListAny = ctJson['data'];
  } else if (ctJson is List) {
    ctListAny = ctJson;
  } else {
    ctListAny = const [];
  }
  final ctList = (ctListAny as List).cast<Map>();

  // 3) Ảnh cho từng biến thể
  final enriched = <Map<String, dynamic>>[];
  for (final ct in ctList) {
    final mactsp = ct['machitietsanpham'] ?? ct['id'];
    try {
      final haJson =
          await _api.get('/hinhanhsanpham/sanpham/$mactsp', headers: _headers());
      final dynamic haListAny =
          (haJson is Map && haJson['data'] is List) ? haJson['data'] : haJson;
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

        // ----- chi tiết -----
        final ctJson = await _safeGet(
          '/chitietsanpham',
          headers: _headers(),
          query: {'masanpham': '$masp'},
        );

        final dynamic ctListAny =
            (ctJson['items'] is List) ? ctJson['items'] : ctJson['data'];
        final ctList = (ctListAny is List) ? ctListAny.cast<Map>() : <Map>[];

        // ----- ảnh từng biến thể -----
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
        results[i] = spClone; // giữ đúng vị trí
      });
    }

    _pump();
    await done.future;

    return results
        .whereType<Map<String, dynamic>>()
        .map(Product.fromJson)
        .toList();
  }

  // ---------------- Helpers ----------------

  /// GET with small retry to avoid transient network/server hiccups.
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
        // tiny backoff
        await Future.delayed(Duration(milliseconds: 200 * attempt));
      }
    }
  }

  /// Trích ra List từ response: hỗ trợ {data: [...]}, {items: [...]}, hoặc [...]
  List<Map<String, dynamic>> _extractList(dynamic res) {
    final dynamic body = (res is Map && res['data'] is List)
        ? res['data']
        : (res is Map && res['items'] is List)
            ? res['items']
            : res;
    final list = body is List ? body : const [];
    return list.cast<Map<String, dynamic>>();
  }

  int _cmpId(dynamic a, dynamic b) {
    final ai = a?.toString() ?? '';
    final bi = b?.toString() ?? '';
    final aiNum = int.tryParse(ai);
    final biNum = int.tryParse(bi);
    if (aiNum != null && biNum != null) return aiNum.compareTo(biNum);
    return ai.compareTo(bi);
  }
}
