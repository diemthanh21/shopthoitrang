import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class ApiException implements Exception {
  final int? statusCode;
  final String message;
  ApiException(this.message, {this.statusCode});
  @override
  String toString() => 'ApiException(status=$statusCode, message=$message)';
}

class ApiClient {
  final http.Client _http;
  final Duration timeout;
  ApiClient(
      [http.Client? httpClient, this.timeout = const Duration(seconds: 15)])
      : _http = httpClient ?? http.Client();

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, String>? headers,
    Map<String, String>? query,
    Map<String, String>? queryParameters,
  }) async {
    final base = await _headers();
    final merged = {
      ...base,
      if (headers != null) ...headers,
    };
    Uri uri = Uri.parse('${AppConfig.apiBaseUrl}$path');
    final effectiveQuery = <String, String>{
      ...uri.queryParameters,
      if (query != null) ...query,
      if (queryParameters != null) ...queryParameters,
    };
    if (effectiveQuery.isNotEmpty) {
      uri = uri.replace(
        queryParameters: effectiveQuery,
      );
    }
    try {
      final res = await _http.get(uri, headers: merged).timeout(timeout);
      return _handleResponse(res);
    } on SocketException {
      throw ApiException('Không thể kết nối máy chủ');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Lỗi không xác định: $e');
    }
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body,
      {Map<String, String>? headers}) async {
    final base = await _headers();
    final merged = {
      ...base,
      if (headers != null) ...headers,
    };
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path');
    try {
      final res = await _http
          .post(uri, headers: merged, body: jsonEncode(body))
          .timeout(timeout);
      return _handleResponse(res);
    } on SocketException {
      throw ApiException('Không thể kết nối máy chủ');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Lỗi không xác định: $e');
    }
  }

  Future<Map<String, dynamic>> put(String path, Map<String, dynamic> body,
      {Map<String, String>? headers}) async {
    final base = await _headers();
    final merged = {
      ...base,
      if (headers != null) ...headers,
    };
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path');
    try {
      final res = await _http
          .put(uri, headers: merged, body: jsonEncode(body))
          .timeout(timeout);
      return _handleResponse(res);
    } on SocketException {
      throw ApiException('Không thể kết nối máy chủ');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Lỗi không xác định: $e');
    }
  }

  Map<String, dynamic> _handleResponse(http.Response res) {
    final text = res.body.isEmpty ? '{}' : res.body;
    Map<String, dynamic> json;
    try {
      final decoded = jsonDecode(text);
      json = decoded is Map<String, dynamic> ? decoded : {'data': decoded};
    } catch (_) {
      json = {'raw': text};
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return json;
    }

    final msg =
        (json['message'] ?? json['error'] ?? 'Yêu cầu thất bại').toString();
    throw ApiException(msg, statusCode: res.statusCode);
  }

  Future<Map<String, String>> _headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    // Debug: Log token để kiểm tra
    if (kDebugMode && token != null) {
      // Decode token để xem user info (chỉ phần payload, không verify)
      try {
        final parts = token.split('.');
        if (parts.length == 3) {
          final payload = parts[1];
          final normalized = base64Url.normalize(payload);
          final decoded = utf8.decode(base64Url.decode(normalized));
          final json = jsonDecode(decoded);
          print(
              '[ApiClient] Using token for user: ${json['email']} (id: ${json['makhachhang']})');
        }
      } catch (e) {
        print('[ApiClient] Token exists but cannot decode: $e');
      }
    }

    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}
