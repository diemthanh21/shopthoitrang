import '../models/notification_model.dart';
import 'api_client.dart';

class NotificationService {
  final ApiClient _api;

  NotificationService(this._api);

  /// Lấy danh sách thông báo khuyến mãi từ server
  /// Tạm thời lấy từ bảng khuyenmai - admin set khuyến mãi/voucher
  Future<List<PromotionNotification>> getPromotions() async {
    try {
      // Lấy danh sách khuyến mãi đang hoạt động
      final response = await _api.get('/khuyenmai');

      // response là Map<String, dynamic>
      final List<dynamic> data = response is List
          ? response
          : (response['data'] is List
              ? response['data']
              : (response['items'] is List ? response['items'] : []));

      final promos = data
          .whereType<Map<String, dynamic>>()
          .map((json) => PromotionNotification.fromJson(json))
          .toList();

      promos.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return promos;
    } catch (e) {
      throw Exception('Không thể tải thông báo khuyến mãi: $e');
    }
  }

  /// Lấy danh sách cập nhật đơn hàng của user
  Future<List<OrderNotification>> getOrderUpdates({String? customerId}) async {
    try {
      // Gọi API lấy đơn hàng của user, sắp xếp theo ngày mới nhất
      final response = await _api.get('/donhang');

      // response là Map<String, dynamic>
      final List<dynamic> data = response is List
          ? response
          : (response['data'] is List
              ? response['data']
              : (response['items'] is List ? response['items'] : []));

      // Sắp xếp theo ngày đặt hàng mới nhất
      final filteredData = data.whereType<Map<String, dynamic>>().where((json) {
        if (customerId == null || customerId.isEmpty) {
          return true;
        }
        final dynamic idValue = json['makhachhang'] ??
            json['maKhachHang'] ??
            json['customerId'] ??
            json['maKh'];
        return idValue?.toString() == customerId;
      }).toList();

      final orders =
          filteredData.map((json) => OrderNotification.fromJson(json)).toList();

      orders.sort((a, b) {
        final aDate = a.statusUpdatedAt ?? a.orderDate;
        final bDate = b.statusUpdatedAt ?? b.orderDate;
        return bDate.compareTo(aDate);
      });

      return orders;

    } catch (e) {
      throw Exception('Không thể tải cập nhật đơn hàng: $e');
    }
  }

  /// Đánh dấu thông báo đã đọc (tạm thời không implement vì chưa có bảng tracking)
  Future<void> markAsRead(String notificationId, String type) async {
    try {
      // TODO: Implement khi có bảng thongbao trong DB
      // await _api.put('/notifications/$notificationId/read', {
      //   'type': type,
      // });
    } catch (e) {
      // Không throw error để không làm gián đoạn UX
      print('Lỗi đánh dấu đã đọc: $e');
    }
  }

  /// Lấy số lượng thông báo chưa đọc
  Future<int> getUnreadCount() async {
    try {
      final response = await _api.get('/notifications/unread-count');
      return response['count'] ?? 0;
    } catch (e) {
      return 0;
    }
  }
}
