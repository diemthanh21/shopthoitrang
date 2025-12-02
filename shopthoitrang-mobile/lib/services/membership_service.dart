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

  // Lấy thông tin điểm tích lũy (điểm hiện tại, pending, năm)
  Future<PointsSummary?> getPointsSummary(int maKhachHang) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/membership/$maKhachHang/points'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return PointsSummary.fromJson(data);
      }
      return null;
    } catch (e) {
      print('Lỗi lấy thông tin điểm: $e');
      return null;
    }
  }

  // Lấy lịch sử giao dịch điểm
  Future<List<Map<String, dynamic>>> getPointHistory(int maKhachHang,
      {int limit = 50}) async {
    try {
      final token = await _getToken();
      if (token == null) return [];

      final response = await http.get(
        Uri.parse(
            '$baseUrl/membership/$maKhachHang/point-history?limit=$limit'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      print('Lỗi lấy lịch sử điểm: $e');
      return [];
    }
  }
}
