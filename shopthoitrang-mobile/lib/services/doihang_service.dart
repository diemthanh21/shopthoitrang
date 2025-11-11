import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class DoiHangService {
  final String baseUrl = '${AppConfig.apiBaseUrl}/doihang';
  String? lastError;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? prefs.getString('auth_token');
  }

  Future<Map<String, dynamic>?> createExchange(
      Map<String, dynamic> payload) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final res = await http.post(
        Uri.parse(baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(payload),
      );
      if (res.statusCode == 201) {
        lastError = null;
        return json.decode(res.body) as Map<String, dynamic>;
      }
      try {
        final b = json.decode(res.body);
        lastError = (b['message'] ?? b['error'] ?? res.body).toString();
      } catch (_) {
        lastError = 'Lỗi tạo yêu cầu đổi hàng: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  /// Lấy danh sách yêu cầu đổi hàng theo khách hàng
  Future<List<dynamic>?> getMyExchanges(int maKhachHang) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final res = await http.get(
        Uri.parse('$baseUrl/khachhang/$maKhachHang'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (res.statusCode == 200) {
        lastError = null;
        final body = json.decode(res.body);
        if (body is List) return body;
        if (body is Map && body['data'] is List) return body['data'];
        return [];
      }
      try {
        final b = json.decode(res.body);
        lastError = (b['message'] ?? b['error'] ?? res.body).toString();
      } catch (_) {
        lastError = 'Lỗi khi tải danh sách đổi hàng: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  Future<Map<String, dynamic>?> getExchange(int id) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final res = await http.get(
        Uri.parse('$baseUrl/$id'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token'
        },
      );
      if (res.statusCode == 200) {
        lastError = null;
        return json.decode(res.body) as Map<String, dynamic>;
      }
      try {
        final b = json.decode(res.body);
        lastError = (b['message'] ?? b['error'] ?? res.body).toString();
      } catch (_) {
        lastError = 'Lỗi tải chi tiết đổi hàng: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  /// Lấy timeline (logs) của một yêu cầu đổi hàng
  Future<List<dynamic>?> getLogs(int maDoiHang) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final res = await http.get(
        Uri.parse('$baseUrl/$maDoiHang/logs'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (res.statusCode == 200) {
        lastError = null;
        final body = json.decode(res.body);
        if (body is List) return body;
        if (body is Map && body['data'] is List) return body['data'];
        return [];
      }
      try {
        final b = json.decode(res.body);
        lastError = (b['message'] ?? b['error'] ?? res.body).toString();
      } catch (_) {
        lastError = 'Lỗi khi tải lịch sử đổi hàng: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }
}

final doiHangService = DoiHangService();
