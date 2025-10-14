import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../models/auth_models.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService(ApiClient());

  AuthUser? _user;
  String? _token;
  bool _loading = false;
  String? _error;

  AuthUser? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _loading;
  String? get error => _error;

  Future<void> login(String email, String password) async {
    _loading = true; _error = null; notifyListeners();
    try {
      final resp = await _authService.loginCustomer(email: email, password: password);
      _user = resp.user; _token = resp.token;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      await prefs.setString('user', jsonEncode({'id': _user!.id, 'name': _user!.name}));
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false; notifyListeners();
    }
  }

  Future<void> register(String email, String password, String name, {String? phone}) async {
    _loading = true; _error = null; notifyListeners();
    try {
      final resp = await _authService.registerCustomer(email: email, password: password, name: name, phone: phone);
      _user = resp.user; _token = resp.token;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      await prefs.setString('user', jsonEncode({'id': _user!.id, 'name': _user!.name}));
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false; notifyListeners();
    }
  }

  Future<void> logout() async {
    _user = null; _token = null; notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
  }
}
