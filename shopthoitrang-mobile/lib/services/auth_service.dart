import 'api_client.dart';
import '../models/auth_models.dart';

class AuthService {
  final ApiClient _api;
  AuthService(this._api);

  Future<AuthResponse> loginCustomer({required String email, required String password}) async {
    final json = await _api.post('/auth/login/customer', {
      'email': email,
      'matkhau': password,
    });
    return AuthResponse.fromJson(json);
  }

  Future<AuthResponse> registerCustomer({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    final json = await _api.post('/auth/register/customer', {
      'email': email,
      'matkhau': password,
      'hoten': name,
      if (phone != null) 'sodienthoai': phone,
    });
    return AuthResponse.fromJson(json);
  }
}
