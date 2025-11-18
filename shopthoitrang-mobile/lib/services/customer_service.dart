import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/user_model.dart';

class CustomerService {
  final String baseUrl = AppConfig.apiBaseUrl;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  // Lấy thông tin khách hàng hiện tại
  Future<User?> getCurrentCustomer() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return User.fromJson(data);
      }
      return null;
    } catch (e) {
      print('Lỗi lấy thông tin khách hàng: $e');
      return null;
    }
  }

  // Cập nhật thông tin khách hàng
  Future<bool> updateCustomer({
    required int maKhachHang,
    String? hoTen,
    String? email,
    String? soDienThoai,
    String? gioiTinh,
    String? ngaySinh,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return false;

      // Thử gọi API (nếu có endpoint)
      final body = <String, dynamic>{};
      if (hoTen != null) body['hoten'] = hoTen;
      if (email != null) body['email'] = email;
      if (soDienThoai != null) body['sodienthoai'] = soDienThoai;
      if (gioiTinh != null) body['gioitinh'] = gioiTinh;
      if (ngaySinh != null) body['ngaysinh'] = ngaySinh;

      try {
        final response = await http.put(
          Uri.parse('$baseUrl/taikhoankhachhang/$maKhachHang'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
          body: json.encode(body),
        );

        print('Update response status: ${response.statusCode}');
        print('Update response body: ${response.body}');

        if (response.statusCode == 200) {
          // Cập nhật local storage sau khi API thành công
          final prefs = await SharedPreferences.getInstance();
          final userJson = prefs.getString('user');
          if (userJson != null) {
            final userData = json.decode(userJson) as Map<String, dynamic>;

            // Cập nhật các field
            if (hoTen != null) userData['hoten'] = hoTen;
            if (email != null) userData['email'] = email;
            if (soDienThoai != null) userData['sodienthoai'] = soDienThoai;
            if (gioiTinh != null) userData['gioitinh'] = gioiTinh;
            if (ngaySinh != null) userData['ngaysinh'] = ngaySinh;

            // Lưu lại
            await prefs.setString('user', json.encode(userData));
          }
          return true;
        }
      } catch (apiError) {
        print('Lỗi API: $apiError');
      }

      // Nếu API chưa có, cập nhật local storage
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      if (userJson != null) {
        final userData = json.decode(userJson) as Map<String, dynamic>;

        // Cập nhật các field
        if (hoTen != null) userData['hoten'] = hoTen;
        if (email != null) userData['email'] = email;
        if (soDienThoai != null) userData['sodienthoai'] = soDienThoai;
        if (gioiTinh != null) userData['gioitinh'] = gioiTinh;
        if (ngaySinh != null) userData['ngaysinh'] = ngaySinh;

        // Lưu lại
        await prefs.setString('user', json.encode(userData));
        return true;
      }

      return false;
    } catch (e) {
      print('Lỗi cập nhật thông tin: $e');
      return false;
    }
  }

  // Đổi mật khẩu
  Future<bool> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return false;

      final response = await http.put(
        Uri.parse('$baseUrl/auth/change-password/customer'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'oldPassword': oldPassword,
          'newPassword': newPassword,
        }),
      );

      print('Change password response: ${response.statusCode}');
      print('Change password body: ${response.body}');

      return response.statusCode == 200;
    } catch (e) {
      print('Lỗi đổi mật khẩu: $e');
      return false;
    }
  }
}
