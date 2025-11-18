import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/rating_model.dart';

class RatingService {
  final String baseUrl = '${AppConfig.apiBaseUrl}/danhgia';
  String? lastError;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? prefs.getString('auth_token');
  }

  /// Lấy đánh giá theo sản phẩm
  Future<List<Rating>> listByProduct(int productId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl?masanpham=$productId'));
      if (res.statusCode == 200) {
        final body = json.decode(res.body);
        final list =
            (body is List) ? body : (body['data'] is List ? body['data'] : []);
        return (list as List)
            .map((e) => Rating.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      lastError = e.toString();
    }
    return [];
  }

  /// Tạo đánh giá mới
  Future<bool> create({
    required int productId,
    int? variantId,
    required int customerId,
    required int score,
    String? comment,
  }) async {
    try {
      final token = await _getToken();
      final body = {
        'masanpham': productId,
        if (variantId != null) 'machitietsanpham': variantId,
        'makhachhang': customerId,
        'diemdanhgia': score,
        if (comment != null) 'binhluan': comment,
      };
      final response = await http.post(Uri.parse(baseUrl),
          headers: {
            'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          },
          body: json.encode(body));
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      lastError = e.toString();
      return false;
    }
  }
}
