// lib/services/auth_service.dart
import 'api_client.dart';
import '../models/auth_models.dart';

class AuthService {
  final ApiClient _api;
  AuthService(this._api);

  /// Đăng nhập khách hàng
  Future<AuthResponse> loginCustomer({
    required String email,
    required String password,
  }) async {
    final json = await _api.post('/auth/login/customer', {
      'email': email,
      'matkhau': password,
    });
    return AuthResponse.fromJson(json);
  }

  /// Đăng ký khách hàng mới
  Future<AuthResponse> registerCustomer({
    required String email,
    required String password,
    required String name,
    String? phone,
    String? username, // TENDANGNHAP
    String? gioiTinh, // Nam / Nữ / Khác
    DateTime? ngaySinh, // YYYY-MM-DD
  }) async {
    final body = {
      'email': email,
      'matkhau': password,
      'hoten': name,
      if (phone != null && phone.isNotEmpty) 'sodienthoai': phone,
      if (username != null && username.isNotEmpty) 'tendangnhap': username,
      if (gioiTinh != null && gioiTinh.isNotEmpty) 'gioitinh': gioiTinh,
      if (ngaySinh != null)
        'ngaysinh': ngaySinh.toIso8601String().split('T').first,
    };
    final json = await _api.post('/auth/register/customer', body);
    return AuthResponse.fromJson(json);
  }

  /// Lấy thông tin hồ sơ người dùng (nếu backend có endpoint này)
  Future<TaiKhoanKhachHang> getProfile() async {
    // ApiClient tự gắn token nếu đã lưu SharedPreferences.
    // Thử nhiều endpoint tuỳ backend đang dùng.
    final candidates = [
      '/auth/me',
      '/auth/current',
      '/auth/profile',
      '/auth/user',
    ];
    Map<String, dynamic>? resp;
    for (final p in candidates) {
      try {
        resp = await _api.get(p);
        if (resp.isNotEmpty) break;
      } catch (_) {
        // thử endpoint tiếp theo
        continue;
      }
    }
    resp ??= {};
    final userJson =
        (resp['data'] is Map && (resp['data'] as Map).containsKey('user'))
            ? (resp['data']['user'] as Map<String, dynamic>)
            : (resp['user'] ?? resp['data'] ?? resp);
    return TaiKhoanKhachHang.fromJson(
        Map<String, dynamic>.from(userJson as Map));
  }
}
