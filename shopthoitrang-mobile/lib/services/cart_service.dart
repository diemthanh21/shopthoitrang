import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/cart_model.dart';

class CartService {
  final String baseUrl = '${AppConfig.apiBaseUrl}/cart';
  String? lastError; // store last error message for UI

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    // Prefer the token saved by AuthProvider; fallback to legacy key if present
    return prefs.getString('token') ?? prefs.getString('auth_token');
  }

  /// Lấy giỏ hàng hiện tại của người dùng
  Future<Cart> getCart() async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Chưa đăng nhập');
      }

      final uri = Uri.parse(baseUrl);
      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final raw = response.body;
        final data = json.decode(raw);
        // Debug: print items length (non-fatal)
        try {
          final items = (data['items'] as List?) ?? const [];
          // ignore: avoid_print
          print(
              '[CartService.getCart] ${uri.toString()} -> items=${items.length} total=${data['total']}');
        } catch (_) {}
        lastError = null;
        return Cart.fromJson(data);
      } else {
        final body = response.body;
        try {
          final jsonBody = json.decode(body);
          lastError =
              (jsonBody['message'] ?? jsonBody['error'] ?? body).toString();
        } catch (_) {
          lastError = 'Lỗi khi lấy giỏ hàng: ${response.statusCode}';
        }
        throw Exception(lastError);
      }
    } catch (e) {
      lastError = e.toString();
      print('Error getting cart: $e');
      return Cart.empty();
    }
  }

  /// Thêm sản phẩm vào giỏ hàng
  Future<bool> addToCart({
    required int variantId,
    required double price,
    int quantity = 1,
    int? sizeBridgeId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        throw Exception('Chưa đăng nhập');
      }

      final response = await http.post(
        Uri.parse('$baseUrl/add'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'variantId': variantId,
          'quantity': quantity,
          'price': price,
          if (sizeBridgeId != null) 'chitietsizeId': sizeBridgeId,
        }),
      );

      if (response.statusCode == 200) {
        lastError = null;
        return true;
      } else {
        // Capture server error message for UI
        final body = response.body;
        try {
          final jsonBody = json.decode(body);
          lastError =
              (jsonBody['message'] ?? jsonBody['error'] ?? body).toString();
        } catch (_) {
          lastError = 'Yêu cầu thất bại (${response.statusCode})';
        }
        print(
            'Failed to add to cart: status=${response.statusCode}, body=$body');
        return false;
      }
    } catch (e) {
      lastError = e.toString();
      print('Error adding to cart: $e');
      return false;
    }
  }

  /// Cập nhật số lượng sản phẩm trong giỏ
  Future<bool> updateQuantity(int itemId, int quantity) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Chưa đăng nhập');
      }

      final response = await http.put(
        Uri.parse('$baseUrl/update/$itemId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'quantity': quantity,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error updating quantity: $e');
      return false;
    }
  }

  Future<bool> updateGiftSelection({
    required int itemId,
    required int variantId,
    int? sizeBridgeId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Ch��a �`��ng nh��-p';
        throw Exception('Ch��a �`��ng nh��-p');
      }

      final response = await http.put(
        Uri.parse('$baseUrl/gift/$itemId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'variantId': variantId,
          if (sizeBridgeId != null) 'sizeBridgeId': sizeBridgeId,
        }),
      );

      if (response.statusCode == 200) {
        lastError = null;
        return true;
      }

      final body = response.body;
      try {
        final jsonBody = json.decode(body);
        lastError =
            (jsonBody['message'] ?? jsonBody['error'] ?? body).toString();
      } catch (_) {
        lastError = 'YA�u c��u th���t b���i (${response.statusCode})';
      }
      return false;
    } catch (e) {
      lastError = e.toString();
      print('Error updating gift selection: $e');
      return false;
    }
  }

  /// Xóa sản phẩm khỏi giỏ hàng
  Future<bool> removeFromCart(int itemId) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Chưa đăng nhập');
      }

      final response = await http.delete(
        Uri.parse('$baseUrl/remove/$itemId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error removing from cart: $e');
      return false;
    }
  }

  /// Xóa toàn bộ giỏ hàng
  Future<bool> clearCart() async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Chưa đăng nhập');
      }

      final response = await http.delete(
        Uri.parse('$baseUrl/clear'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error clearing cart: $e');
      return false;
    }
  }
}
