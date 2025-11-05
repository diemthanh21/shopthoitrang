import '../services/api_client.dart';
import '../models/user_model.dart';

class UserService {
  final ApiClient _api;

  UserService(this._api);

  /// Lấy thông tin user hiện tại (đã đăng nhập)
  Future<User> getCurrentUser() async {
    try {
      final response = await _api.get('/auth/me');

      // Response có thể là { user: {...} } hoặc trực tiếp {...}
      final userData = response['user'] ?? response;

      return User.fromJson(userData);
    } catch (e) {
      throw Exception('Không thể tải thông tin người dùng: $e');
    }
  }

  /// Cập nhật thông tin user
  Future<User> updateProfile({
    String? fullName,
    String? email,
    String? phone,
    String? gender,
    String? birthDate,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (fullName != null) body['hoten'] = fullName;
      if (email != null) body['email'] = email;
      if (phone != null) body['sodienthoai'] = phone;
      if (gender != null) body['gioitinh'] = gender;
      if (birthDate != null) body['ngaysinh'] = birthDate;

      final response = await _api.post('/taikhoankhachhang/update', body);
      final userData = response['user'] ?? response['data'] ?? response;

      return User.fromJson(userData);
    } catch (e) {
      throw Exception('Không thể cập nhật thông tin: $e');
    }
  }
}
