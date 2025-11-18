import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../models/auth_models.dart'; // chứa TaiKhoanKhachHang & AuthResponse

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService(ApiClient());

  TaiKhoanKhachHang? _user;
  String? _token;
  bool _loading = false;
  String? _error;

  TaiKhoanKhachHang? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  bool get isLoading => _loading;
  String? get error => _error;

  /// Gọi ở initState của app để khôi phục phiên
  Future<void> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final savedToken = prefs.getString('token');
    final savedUser = prefs.getString('user');

    if (kDebugMode) {
      print('AuthProvider.loadSession: Checking for saved session...');
      print('AuthProvider.loadSession: Found token = ${savedToken != null}');
      print('AuthProvider.loadSession: Found user = ${savedUser != null}');
    }

    if (savedToken != null && savedToken.isNotEmpty && savedUser != null) {
      try {
        final map = jsonDecode(savedUser) as Map<String, dynamic>;
        _user = TaiKhoanKhachHang.fromJson(map);
        _token = savedToken;

        if (kDebugMode) {
          print(
              'AuthProvider.loadSession: Loaded session for user: ${_user!.email} (id: ${_user!.maKhachHang})');
        }
      } catch (e) {
        // dữ liệu cũ lỗi → xoá
        if (kDebugMode)
          print(
              'AuthProvider.loadSession: Error loading session, clearing: $e');
        await prefs.remove('token');
        await prefs.remove('user');
      }
    } else {
      if (kDebugMode) print('AuthProvider.loadSession: No saved session found');
    }
    notifyListeners();
  }

  Future<void> login(String emailOrUsername, String password) async {
    if (kDebugMode) {
      print('========================================');
      print('AuthProvider.login: Starting login for: $emailOrUsername');
      print('AuthProvider.login: Current token before login: $_token');
      print('========================================');
    }

    _loading = true;
    _error = null;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();

    try {
      // Xóa token cũ trước khi đăng nhập
      await prefs.remove('token');
      await prefs.remove('user');

      if (kDebugMode) {
        print('AuthProvider.login: Cleared old token from SharedPreferences');
      }

      // tuỳ backend: có thể là email hoặc username
      final resp = await _authService.loginCustomer(
        email: emailOrUsername,
        password: password,
      );

      if (kDebugMode) {
        print('AuthProvider.login: Got response from server');
        print(
            'AuthProvider.login: success = ${resp.success}, token empty = ${resp.token.isEmpty}');
      }

      if (!resp.success || resp.token.isEmpty) {
        throw Exception(
            resp.message.isNotEmpty ? resp.message : 'Đăng nhập thất bại');
      }
      _user = resp.user;
      _token = resp.token;

      // Lưu token MỚI
      await prefs.setString('token', _token!);
      await prefs.setString(
          'user', jsonEncode(_user!.toJson())); // lưu full user

      if (kDebugMode) {
        print('✅ AuthProvider.login: Login successful');
        print(
            '✅ AuthProvider.login: userId = ${_user!.maKhachHang}, email = ${_user!.email}');
        print('✅ AuthProvider.login: New token saved to SharedPreferences');

        // Verify token đã được lưu
        final savedToken = await prefs.getString('token');
        print(
            '✅ AuthProvider.login: Verified saved token exists = ${savedToken != null}');
      }
    } catch (e, st) {
      if (kDebugMode) {
        print('❌ AuthProvider.login error: $e');
        print('❌ Stack trace: $st');
      }
      _error = e.toString();
      _user = null;
      _token = null;

      // QUAN TRỌNG: Xóa token trong SharedPreferences khi login thất bại
      await prefs.remove('token');
      await prefs.remove('user');

      if (kDebugMode) {
        print('❌ AuthProvider.login: Login failed, cleared all tokens');
        print('❌ AuthProvider.login: isAuthenticated = $isAuthenticated');

        // Verify token đã bị xóa
        final remainingToken = await prefs.getString('token');
        print(
            '❌ AuthProvider.login: Remaining token in prefs = $remainingToken');
      }
    } finally {
      _loading = false;
      notifyListeners();

      if (kDebugMode) {
        print('========================================');
        print('AuthProvider.login: Login process completed');
        print('AuthProvider.login: Final isAuthenticated = $isAuthenticated');
        print('========================================');
      }
    }
  }

  Future<void> register(
    String email,
    String password,
    String name, {
    String? phone,
    String? username, // nếu backend yêu cầu TENDANGNHAP
    String? gioiTinh, // "Nam"/"Nữ"/"Khác"
    DateTime? ngaySinh,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final resp = await _authService.registerCustomer(
        email: email,
        password: password,
        name: name,
        phone: phone,
        username: username,
        gioiTinh: gioiTinh,
        ngaySinh: ngaySinh,
      );
      if (!resp.success || resp.token.isEmpty) {
        throw Exception(
            resp.message.isNotEmpty ? resp.message : 'Đăng ký thất bại');
      }
      _user = resp.user;
      _token = resp.token;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      await prefs.setString('user', jsonEncode(_user!.toJson()));
    } catch (e, st) {
      if (kDebugMode) print('AuthProvider.register error: $e\n$st');
      _error = e.toString();
      _user = null;
      _token = null;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    if (kDebugMode) print('AuthProvider.logout: Clearing user and token');

    // Clear memory state first
    _user = null;
    _token = null;
    _error = null;

    // Clear SharedPreferences - xóa tất cả auth-related keys
    final prefs = await SharedPreferences.getInstance();
    final keys = ['token', 'user', 'auth_token']; // Bao gồm cả legacy keys
    for (final key in keys) {
      await prefs.remove(key);
    }

    // Verify token đã bị xóa
    final remainingToken = prefs.getString('token');
    if (kDebugMode) {
      print('AuthProvider.logout: Token removed from SharedPreferences');
      print('AuthProvider.logout: Remaining token = $remainingToken');
      print('AuthProvider.logout: isAuthenticated = $isAuthenticated');
    }

    // Notify listeners AFTER all cleanup is done
    notifyListeners();
  }

  /// Tuỳ backend: có thể gọi để đồng bộ lại thông tin user (khi đã có token)
  Future<void> refreshProfile({bool silent = false}) async {
    if (!isAuthenticated) return;
    if (!silent) {
      _loading = true;
      _error = null;
      notifyListeners();
    }
    try {
      final fresh = await _authService.getProfile();
      _user = fresh;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(_user!.toJson()));
    } catch (e, st) {
      if (kDebugMode) print('AuthProvider.refreshProfile error: $e\n$st');
      _error = e.toString();
    } finally {
      if (!silent) {
        _loading = false;
        notifyListeners();
      }
    }
  }
}
