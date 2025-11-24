import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/membership_model.dart';

class AddressService {
  final String baseUrl = AppConfig.apiBaseUrl;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  // Lấy danh sách địa chỉ
  Future<List<DiaChiKhachHang>> getAddresses(int maKhachHang) async {
    try {
      final token = await _getToken();
      if (token == null) return [];

      final response = await http.get(
        Uri.parse('$baseUrl/diachikhachhang/khachhang/$maKhachHang'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => DiaChiKhachHang.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Lỗi lấy danh sách địa chỉ: $e');
      return [];
    }
  }

  // Thêm địa chỉ mới
  Future<bool> addAddress(
    int maKhachHang, {
    required String ten,
    required String soDienThoai,
    required String tinh,
    required String phuong,
    required String diaChiCuThe,
    bool macDinh = false,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        print('❌ Không có token');
        return false;
      }

      print('📤 Đang gửi địa chỉ mới...');
      print('   Tên: $ten');
      print('   SĐT: $soDienThoai');
      print('   Tỉnh: $tinh');
      print('   Phường: $phuong');
      print('   Địa chỉ: $diaChiCuThe');

      // Thử gửi với format mới (có cấu trúc)
      final newFormatBody = {
        'makhachhang': maKhachHang,
        'ten': ten,
        'sodienthoai': soDienThoai,
        'tinh': tinh,
        'phuong': phuong,
        'diachicuthe': diaChiCuThe,
        'macdinh': macDinh,
      };

      var response = await http.post(
        Uri.parse('$baseUrl/diachikhachhang'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode(newFormatBody),
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      // Nếu thất bại (có thể server chưa có cột mới), thử format cũ
      if (response.statusCode != 201 && response.statusCode != 200) {
        print('⚠️ Format mới thất bại, thử format cũ...');

        // Format cũ: "Tên | SĐT | Tỉnh, Phường | Địa chỉ"
        final oldFormatAddress =
            '$ten | $soDienThoai | $tinh, $phuong | $diaChiCuThe';

        response = await http.post(
          Uri.parse('$baseUrl/diachikhachhang'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
          body: json.encode({
            'makhachhang': maKhachHang,
            'diachi': oldFormatAddress,
          }),
        );

        print('📡 Retry status: ${response.statusCode}');
        print('📡 Retry body: ${response.body}');
      }

      final success = response.statusCode == 201 || response.statusCode == 200;
      print(success ? '✅ Lưu thành công' : '❌ Lưu thất bại');

      return success;
    } catch (e) {
      print('❌ Lỗi thêm địa chỉ: $e');
      return false;
    }
  }

  // Cập nhật địa chỉ
  Future<bool> updateAddress(
    int maDiaChi, {
    required String ten,
    required String soDienThoai,
    required String tinh,
    required String phuong,
    required String diaChiCuThe,
    bool macDinh = false,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        print('❌ Không có token');
        return false;
      }

      print('📤 Đang cập nhật địa chỉ #$maDiaChi...');

      // Thử gửi với format mới
      var response = await http.put(
        Uri.parse('$baseUrl/diachikhachhang/$maDiaChi'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'ten': ten,
          'sodienthoai': soDienThoai,
          'tinh': tinh,
          'phuong': phuong,
          'diachicuthe': diaChiCuThe,
          'macdinh': macDinh,
        }),
      );

      print('📡 Response status: ${response.statusCode}');

      // Nếu thất bại, thử format cũ
      if (response.statusCode != 200) {
        print('⚠️ Format mới thất bại, thử format cũ...');

        final oldFormatAddress =
            '$ten | $soDienThoai | $tinh, $phuong | $diaChiCuThe';

        response = await http.put(
          Uri.parse('$baseUrl/diachikhachhang/$maDiaChi'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
          body: json.encode({
            'diachi': oldFormatAddress,
          }),
        );

        print('📡 Retry status: ${response.statusCode}');
      }

      final success = response.statusCode == 200;
      print(success ? '✅ Cập nhật thành công' : '❌ Cập nhật thất bại');

      return success;
    } catch (e) {
      print('❌ Lỗi cập nhật địa chỉ: $e');
      return false;
    }
  }

  // Xóa địa chỉ
  Future<bool> deleteAddress(int maDiaChi) async {
    try {
      final token = await _getToken();
      if (token == null) return false;

      final response = await http.delete(
        Uri.parse('$baseUrl/diachikhachhang/$maDiaChi'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Lỗi xóa địa chỉ: $e');
      return false;
    }
  }
}
