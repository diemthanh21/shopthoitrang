import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/membership_model.dart';

class MembershipService {
  final String baseUrl = AppConfig.apiBaseUrl;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  // Lấy thông tin thẻ thành viên của khách hàng
  Future<TheThanhVien?> getMembershipCard(int maKhachHang) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/membership/$maKhachHang'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return TheThanhVien.fromJson(data);
      }
      return null;
    } catch (e) {
      print('Lỗi lấy thẻ thành viên: $e');
      return null;
    }
  }

  // Lấy tích lũy chi tiêu
  Future<TichLuyChiTieu?> getLoyaltyPoints(int maKhachHang) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/loyalty/$maKhachHang'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return TichLuyChiTieu.fromJson(data);
      }
      return null;
    } catch (e) {
      print('Lỗi lấy tích lũy: $e');
      return null;
    }
  }
}
