import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';
import '../models/coupon_model.dart';

class CouponService {
  final String baseUrl = '${AppConfig.apiBaseUrl}/magiamgia';
  String? lastError;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? prefs.getString('auth_token');
  }

  Future<List<Coupon>> getCoupons({bool onlyActive = true}) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Chưa đăng nhập');
      }

      final uri = onlyActive
          ? Uri.parse('$baseUrl?active=true')
          : Uri.parse(baseUrl);

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final raw = response.body;
        final decoded = json.decode(raw);
        final list = _extractList(decoded);
        lastError = null;
        return list
            .whereType<Map<String, dynamic>>()
            .map(Coupon.fromJson)
            .toList();
      } else {
        lastError = 'Không thể tải mã giảm giá (${response.statusCode})';
        return [];
      }
    } catch (e) {
      lastError = e.toString();
      return [];
    }
  }

  List<dynamic> _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map<String, dynamic>) {
      for (final key in ['data', 'items', 'result', 'records']) {
        final value = data[key];
        if (value is List) return value;
      }
    }
    return const [];
  }
}
