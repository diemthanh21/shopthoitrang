import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/order_model.dart';

class OrderService {
  final String baseUrl = '${AppConfig.apiBaseUrl}/donhang';
  String? lastError;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? prefs.getString('auth_token');
  }

  /// Tạo đơn hàng mới
  Future<Order?> createOrder(Order order) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }

      final response = await http.post(
        Uri.parse(baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(order.toJson()),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        lastError = null;
        return Order.fromJson(data);
      } else {
        final body = response.body;
        try {
          final jsonBody = json.decode(body);
          lastError =
              (jsonBody['message'] ?? jsonBody['error'] ?? body).toString();
        } catch (_) {
          lastError = 'Lỗi khi tạo đơn hàng: ${response.statusCode}';
        }
        return null;
      }
    } catch (e) {
      lastError = e.toString();
      print('Error creating order: $e');
      return null;
    }
  }

  /// Lấy danh sách đơn hàng của khách hàng hiện tại
  Future<List<Order>> getMyOrders() async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return [];
      }

      // TODO: Backend cần endpoint /donhang/me hoặc filter by current user
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        lastError = null;
        return data.map((json) => Order.fromJson(json)).toList();
      } else {
        lastError = 'Lỗi khi lấy danh sách đơn hàng';
        return [];
      }
    } catch (e) {
      lastError = e.toString();
      print('Error getting orders: $e');
      return [];
    }
  }

  /// Lấy chi tiết đơn hàng theo ID
  Future<Order?> getOrderById(int orderId) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }

      final response = await http.get(
        Uri.parse('$baseUrl/$orderId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        lastError = null;
        return Order.fromJson(data);
      } else {
        lastError = 'Không tìm thấy đơn hàng';
        return null;
      }
    } catch (e) {
      lastError = e.toString();
      print('Error getting order: $e');
      return null;
    }
  }
}
