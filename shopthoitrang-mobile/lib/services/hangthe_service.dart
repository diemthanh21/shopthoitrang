import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class HangThe {
  final int? maHangThe;
  final String? tenHang;
  final double? dieuKienNam;
  final double? dieuKienTichLuy;
  final double? giamGia;
  final double? voucherSinhNhat;
  final String? uuDai;

  HangThe({
    this.maHangThe,
    this.tenHang,
    this.dieuKienNam,
    this.dieuKienTichLuy,
    this.giamGia,
    this.voucherSinhNhat,
    this.uuDai,
  });

  factory HangThe.fromJson(Map<String, dynamic> json) {
    return HangThe(
      maHangThe: json['mahangthe'],
      tenHang: json['tenhang'],
      dieuKienNam: json['dieukien_nam']?.toDouble(),
      dieuKienTichLuy: json['dieukien_tichluy']?.toDouble(),
      giamGia: json['giamgia']?.toDouble(),
      voucherSinhNhat: json['voucher_sinhnhat']?.toDouble(),
      uuDai: json['uudai'],
    );
  }
}

class HangTheService {
  final String baseUrl = AppConfig.apiBaseUrl;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  // Lấy danh sách tất cả hạng thẻ
  Future<List<HangThe>> getAllHangThe() async {
    try {
      final token = await _getToken();
      if (token == null) return [];

      final response = await http.get(
        Uri.parse('$baseUrl/hangthe'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => HangThe.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Lỗi lấy danh sách hạng thẻ: $e');
      return [];
    }
  }

  // Lấy thông tin hạng thẻ theo ID
  Future<HangThe?> getHangTheById(int id) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/hangthe/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return HangThe.fromJson(json.decode(response.body));
      }
      return null;
    } catch (e) {
      print('Lỗi lấy thông tin hạng thẻ: $e');
      return null;
    }
  }
}
