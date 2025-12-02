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
        body: json.encode(_buildUpdatePayload(order)),
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

  /// Lấy danh sách đơn hàng của khách hàng theo ID
  Future<List<Order>> getOrdersByCustomer(int customerId) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return [];
      }

      final response = await http.get(
        Uri.parse('$baseUrl/khachhang/$customerId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Get orders response: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final responseBody = json.decode(response.body);

        // Xử lý cả trường hợp API trả về array hoặc object với key 'data'
        List<dynamic> data;
        if (responseBody is List) {
          data = responseBody;
        } else if (responseBody is Map && responseBody.containsKey('data')) {
          data = responseBody['data'] as List;
        } else {
          print('❌ Unexpected response format: ${responseBody.runtimeType}');
          return [];
        }

        print('📦 Parsed ${data.length} orders from API');

        final orders = data.map((json) => Order.fromJson(json)).toList();
        print('📋 Mapped to Order objects:');
        for (var order in orders) {
          print('  - Order #${order.id}: ${order.orderStatus}');
        }

        // Lọc bỏ đơn hàng có trạng thái 'cart'
        final filtered =
            orders.where((order) => order.orderStatus != 'cart').toList();
        print('✅ Filtered orders (excluding cart): ${filtered.length}');

        lastError = null;
        return filtered;
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

      print('🔍 Getting order detail for ID: $orderId');
      final response = await http.get(
        Uri.parse('$baseUrl/$orderId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('📥 Order detail response: ${response.statusCode}');
      print('📦 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Parsed order data:');
        print('   - Order ID: ${data['madonhang']}');
        print('   - Items count: ${data['items']?.length ?? 0}');

        var order = Order.fromJson(data);

        // Fallback: nếu chưa có items, gọi API riêng để lấy
        if (order.items.isEmpty) {
          final items = await getOrderItems(orderId);
          if (items.isNotEmpty) {
            order = Order(
              id: order.id,
              customerId: order.customerId,
              orderDate: order.orderDate,
              total: order.total,
              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus,
              orderStatus: order.orderStatus,
              shippingAddress: order.shippingAddress,
              shippingFee: order.shippingFee,
              shippingProvinceSnapshot: order.shippingProvinceSnapshot,
              appliedVoucherIds: order.appliedVoucherIds,
              items: items,
            );
            print('🔁 Fetched ${items.length} items via fallback endpoint');
          }
        }

        lastError = null;
        return order;
      } else {
        lastError = 'Không tìm thấy đơn hàng';
        return null;
      }
    } catch (e) {
      lastError = e.toString();
      print('❌ Error getting order: $e');
      return null;
    }
  }

  /// Fallback: Lấy chi tiết đơn hàng theo mã đơn
  Future<List<OrderItem>> getOrderItems(int orderId) async {
    try {
      final token = await _getToken();
      if (token == null) return [];

      final url = '${AppConfig.apiBaseUrl}/chitietdonhang/donhang/$orderId';
      final res = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (res.statusCode == 200) {
        final list = json.decode(res.body) as List;
        return list.map((e) => OrderItem.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      print('Error getting order items: $e');
      return [];
    }
  }

  /// Cập nhật trạng thái đơn hàng
  Future<Order?> updateOrderStatus(
    int orderId, {
    String? orderStatus,
    String? paymentStatus,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }

      final body = <String, dynamic>{};
      if (orderStatus != null) body['trangthaidonhang'] = orderStatus;
      if (paymentStatus != null) body['trangthaithanhtoan'] = paymentStatus;

      print('🔄 Updating order #$orderId: $body');

      final response = await http.put(
        Uri.parse('$baseUrl/$orderId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(body),
      );

      print('📥 Update response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Order updated successfully');
        lastError = null;
        return Order.fromJson(data);
      } else {
        final body = response.body;
        try {
          final jsonBody = json.decode(body);
          lastError =
              (jsonBody['message'] ?? jsonBody['error'] ?? body).toString();
        } catch (_) {
          lastError = 'Lỗi khi cập nhật đơn hàng: ${response.statusCode}';
        }
        print('❌ Update failed: $lastError');
        return null;
      }
    } catch (e) {
      lastError = e.toString();
      print('❌ Error updating order: $e');
      return null;
    }
  }

  /// Cập nhật toàn bộ đơn hàng (PUT /api/donhang/:id)
  Future<Order?> updateOrder(int orderId, Order order) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return null;
      }

      final response = await http.put(
        Uri.parse('$baseUrl/$orderId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(_buildUpdatePayload(order)),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        lastError = null;
        return Order.fromJson(data);
      } else {
        lastError = _parseError(response.body) ?? 'Cập nhật đơn thất bại';
        return null;
      }
    } catch (e) {
      lastError = e.toString();
      return null;
    }
  }

  /// Hủy đơn hàng
  Future<bool> cancelOrder(int orderId) async {
    final result = await updateOrderStatus(
      orderId,
      orderStatus: 'Đã hủy',
    );
    return result != null;
  }

  /// Xoá đơn hàng (dùng khi giao dịch thanh toán thất bại/cancel trước khi xác nhận)
  Future<bool> deleteOrder(int orderId) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return false;
      }

      final resp = await http.delete(
        Uri.parse('$baseUrl/$orderId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        lastError = null;
        return true;
      }
      lastError = _parseError(resp.body) ?? 'Xoá đơn hàng thất bại';
      return false;
    } catch (e) {
      lastError = e.toString();
      return false;
    }
  }

  /// Cập nhật phương thức thanh toán của đơn hàng
  Future<bool> updatePaymentMethod(int orderId, String method) async {
    try {
      final token = await _getToken();
      if (token == null) {
        lastError = 'Chưa đăng nhập';
        return false;
      }

      final resp = await http.patch(
        Uri.parse('$baseUrl/$orderId/phuongthucthanhtoan'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'value': method}),
      );

      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        lastError = null;
        return true;
      }
      lastError = _parseError(resp.body) ??
          'Cập nhật phương thức thanh toán thất bại';
      return false;
    } catch (e) {
      lastError = e.toString();
      return false;
    }
  }

  String? _parseError(String body) {
    try {
      final j = json.decode(body);
      if (j is Map<String, dynamic>) {
        return (j['message'] ?? j['error'])?.toString();
      }
    } catch (_) {}
    return null;
  }

  Map<String, dynamic> _buildUpdatePayload(Order order) {
    final payload = <String, dynamic>{
      'makhachhang': order.customerId,
      'thanhtien': order.total,
      'phuongthucthanhtoan': order.paymentMethod,
      'trangthaithanhtoan': order.paymentStatus,
      'trangthaidonhang': order.orderStatus,
      'phivanchuyen': order.shippingFee,
      'tinh_giaohang_snapshot': order.shippingProvinceSnapshot,
    };

    if (order.appliedVoucherIds.isNotEmpty) {
      payload['voucher_ids'] = order.appliedVoucherIds;
    }
    if (order.pointsUsed > 0) {
      payload['diem_su_dung'] = order.pointsUsed;
    }
    if (order.pointsDiscountValue > 0) {
      payload['points_discount_value'] = order.pointsDiscountValue;
    }
    final addr = order.shippingAddress;
    if (addr?.maDiaChi != null) {
      payload['madiachi'] = addr!.maDiaChi;
    }
    return payload;
  }
}
