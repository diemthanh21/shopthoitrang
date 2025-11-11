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

      return data.map((json) => PromotionNotification.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Không thể tải thông báo khuyến mãi: $e');
    }
  }

  /// Lấy danh sách cập nhật đơn hàng của user
  Future<List<OrderNotification>> getOrderUpdates() async {
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
      data.sort((a, b) {
        final aDate = a['ngaydathang'] ?? a['ngayDatHang'] ?? '';
        final bDate = b['ngaydathang'] ?? b['ngayDatHang'] ?? '';
        return bDate.compareTo(aDate);
      });

      // Chuyển đổi sang OrderNotification
      return data.map((json) => OrderNotification.fromJson(json)).toList();
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
