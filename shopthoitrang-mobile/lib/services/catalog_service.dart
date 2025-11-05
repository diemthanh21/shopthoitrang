import 'api_client.dart';

class CatalogService {
  final ApiClient _api;
  CatalogService(this._api);

  // ApiClient đã tự thêm Authorization từ SharedPreferences
  static const String _basePath = '/catalog/products';
  static const String _countPath = '/catalog/products/count';

  /// Lấy danh sách sản phẩm theo bộ lọc & sắp xếp.
  Future<List<Map<String, dynamic>>> listProducts({
    String? categoryName, // tên danh mục (ilike)
    double? minPrice,
    double? maxPrice,
    bool onlyFiveStar = false,
    String? orderBy, // 'category' | 'price' | 'rating' | null
    bool sortDesc = false,
    int limit = 20,
    int offset = 0,
  }) async {
    final query = <String, String>{
      if (_hasText(categoryName)) 'categoryName': categoryName!.trim(),
      if (minPrice != null) 'minPrice': _toIntString(minPrice),
      if (maxPrice != null) 'maxPrice': _toIntString(maxPrice),
      if (onlyFiveStar) 'onlyFiveStar': 'true',
      if (_hasText(orderBy)) 'orderBy': orderBy!.trim(),
      'sort': sortDesc ? 'desc' : 'asc',
      'limit': '$limit',
      'offset': '$offset',
    };

    final res = await _api.get(_basePath, query: query);
    return _extractList(res);
  }

  /// Đếm tổng số theo filter (để tính totalPages).
  Future<int> countProducts({
    String? categoryName,
    double? minPrice,
    double? maxPrice,
    bool onlyFiveStar = false,
  }) async {
    // 1) Thử endpoint count chuyên dụng
    try {
      final query = <String, String>{
        if (_hasText(categoryName)) 'categoryName': categoryName!.trim(),
        if (minPrice != null) 'minPrice': _toIntString(minPrice),
        if (maxPrice != null) 'maxPrice': _toIntString(maxPrice),
        if (onlyFiveStar) 'onlyFiveStar': 'true',
      };
      final res = await _api.get(_countPath, query: query);
      final n = (res['total'] ?? res['count'] ?? (res['data']?['count']));
      final v = (n is int) ? n : int.tryParse('$n') ?? 0;
      return v;
    } catch (_) {
      // 2) Fallback: gọi list (không limit/offset) rồi đếm client
      try {
        final query = <String, String>{
          if (_hasText(categoryName)) 'categoryName': categoryName!.trim(),
          if (minPrice != null) 'minPrice': _toIntString(minPrice),
          if (maxPrice != null) 'maxPrice': _toIntString(maxPrice),
          if (onlyFiveStar) 'onlyFiveStar': 'true',
        };
        final res = await _api.get(_basePath, query: query);
        return _extractList(res).length;
      } catch (_) {
        return 0;
      }
    }
  }

  // ----------------- Helpers -----------------

  bool _hasText(String? s) => s != null && s.trim().isNotEmpty;
  String _toIntString(double v) => v.toStringAsFixed(0);

  /// Chuẩn hoá các kiểu response: {data:[...]}, {items:[...]}, hoặc [...]
  List<Map<String, dynamic>> _extractList(dynamic res) {
    final dynamic body = (res is Map && res['data'] is List)
        ? res['data']
        : (res is Map && res['items'] is List)
            ? res['items']
            : res;
    final list = body is List ? body : const [];
    return list.cast<Map<String, dynamic>>();
  }
}
