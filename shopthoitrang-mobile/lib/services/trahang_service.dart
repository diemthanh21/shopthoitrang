import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';

class TraHangService {
  final String baseUrl = '${AppConfig.apiBaseUrl}/trahang';
  String? lastError;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? prefs.getString('auth_token');
  }

  /// Lấy danh sách yêu cầu trả hàng của khách hàng hiện tại
  Future<List<dynamic>?> getMyReturns() async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      // Lấy mã khách hàng từ local storage (đã lưu khi đăng nhập)
      final prefs = await SharedPreferences.getInstance();
      int? maKhachHang;
      try {
        final userStr = prefs.getString('user');
        if (userStr != null) {
          final u = json.decode(userStr) as Map<String, dynamic>;
          final mk = u['maKhachHang'] ?? u['makhachhang'] ?? u['ma_khach_hang'];
          if (mk is int)
            maKhachHang = mk;
          else if (mk is String) maKhachHang = int.tryParse(mk);
        }
      } catch (_) {}
      final res = await http.get(
        Uri.parse(maKhachHang != null
            ? '$baseUrl?makhachhang=$maKhachHang'
            : baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (res.statusCode == 200) {
        lastError = null;
        final body = json.decode(res.body);
        // API trả về { data: [...] } hoặc [...]
        if (body is List) {
          return body;
        } else if (body is Map && body.containsKey('data')) {
          return body['data'] as List<dynamic>?;
        }
        return [];
      } else {
        try {
          final b = json.decode(res.body);
          lastError = (b['message'] ?? b['error'] ?? res.body).toString();
        } catch (_) {
          lastError = 'Lỗi khi tải yêu cầu trả hàng: ${res.statusCode}';
        }
        return null;
      }
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  /// Lấy các yêu cầu trả hàng theo mã đơn hàng (để client hiển thị trạng thái trả hàng trên đơn)
  Future<List<dynamic>?> getByOrder(int orderId) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final uri = Uri.parse('$baseUrl?madonhang=$orderId');
      if (kDebugMode) print('TraHangService.getByOrder: GET $uri');
      final res = await http.get(
        uri,
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
        lastError = 'Lỗi khi tải yêu cầu trả hàng theo đơn: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  Future<List<dynamic>?> getReturnableItems(int orderId, {int? customerId}) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final paramsMap = <String, String>{'madonhang': orderId.toString()};
      if (customerId != null) paramsMap['makhachhang'] = customerId.toString();
      // Build URI safely to avoid accidental path/query mix-ups
      final uri = Uri.parse('$baseUrl/returnable-items').replace(queryParameters: paramsMap);
      if (kDebugMode) print('TraHangService.getReturnableItems: GET $uri');
      final res = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (res.statusCode == 200) {
        lastError = null;
        final body = json.decode(res.body);
        if (body is Map<String, dynamic> && body['data'] is List) {
          return body['data'] as List<dynamic>;
        }
        if (body is List) return body;
        return [];
      }
      try {
        final b = json.decode(res.body);
        lastError = (b['message'] ?? b['error'] ?? res.body).toString();
      } catch (_) {
        lastError = 'Lỗi khi tải danh sách sản phẩm trả: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  Future<Map<String, dynamic>?> createReturn(
      Map<String, dynamic> payload) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final res = await http.post(Uri.parse(baseUrl),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: json.encode(payload));
      if (res.statusCode == 201) {
        lastError = null;
        return json.decode(res.body) as Map<String, dynamic>;
      } else {
        try {
          final b = json.decode(res.body);
          lastError = (b['message'] ?? b['error'] ?? res.body).toString();
        } catch (_) {
          lastError = 'Lỗi khi tạo yêu cầu trả hàng: ${res.statusCode}';
        }
        return null;
      }
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  Future<Map<String, dynamic>?> getReturn(int id) async {
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
          'Authorization': 'Bearer $token',
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
        lastError = 'Lỗi tải chi tiết trả hàng: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  Future<Map<String, dynamic>?> previewRefund(int id) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final res = await http.get(
        Uri.parse('$baseUrl/$id/refund-preview'),
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
        lastError = 'Lỗi xem trước tiền hoàn: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  Future<Map<String, dynamic>?> calculateRefund(int id) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final res = await http.post(
        Uri.parse('$baseUrl/$id/calc-refund'),
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
        lastError = 'Lỗi tính tiền hoàn: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  Future<Map<String, dynamic>?> processRefund(int id,
      {String method = 'GATEWAY'}) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final res = await http.post(Uri.parse('$baseUrl/$id/refund'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token'
          },
          body: json.encode({'phuongthuc': method}));
      if (res.statusCode == 200) {
        lastError = null;
        return json.decode(res.body) as Map<String, dynamic>;
      }
      try {
        final b = json.decode(res.body);
        lastError = (b['message'] ?? b['error'] ?? res.body).toString();
      } catch (_) {
        lastError = 'Lỗi hoàn tiền: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  /// Lấy timeline (logs) của một yêu cầu trả hàng
  Future<List<dynamic>?> getLogs(int maTraHang) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }
      final res = await http.get(
        Uri.parse('$baseUrl/$maTraHang/logs'),
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
        lastError = 'Lỗi khi tải lịch sử trả hàng: ${res.statusCode}';
      }
      return null;
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }
}

final trahangService = TraHangService();