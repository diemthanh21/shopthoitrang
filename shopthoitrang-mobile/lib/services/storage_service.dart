import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;

  StorageService._internal();

  /// Upload one media file by proxying to backend endpoint `/api/uploads/return-media`.
  /// Returns the relative storage path as returned by the server (e.g. "minchunghinhanh/123/...").
  Future<String> uploadReturnMedia({
    required int orderId,
    required File file,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token') ?? prefs.getString('auth_token');
    if (token == null || token.isEmpty) {
      throw Exception('Người dùng chưa đăng nhập');
    }

    final uri = Uri.parse('${AppConfig.apiBaseUrl}/uploads/return-media');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';
    request.fields['orderId'] = orderId.toString();
    final multipartFile = await http.MultipartFile.fromPath('file', file.path);
    request.files.add(multipartFile);

    final streamed = await request.send();
    final resp = await http.Response.fromStream(streamed);
    if (resp.statusCode != 200) {
      String body = resp.body;
      try {
        final parsed = json.decode(resp.body);
        body = parsed['message'] ?? parsed['detail'] ?? resp.body;
      } catch (_) {}
      throw Exception('Upload thất bại: ${resp.statusCode} ${body}');
    }
    final map = json.decode(resp.body) as Map<String, dynamic>;
    final path = map['path'] as String?;
    if (path == null || path.isEmpty) {
      throw Exception('Server không trả về đường dẫn file');
    }
    return path;
  }
}
