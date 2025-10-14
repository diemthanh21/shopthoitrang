class AuthUser {
  final int id;
  final String name;
  final String? email;
  final String role;

  AuthUser({required this.id, required this.name, this.email, required this.role});

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['makhachhang'] ?? json['id'] ?? 0,
        name: json['hoten'] ?? json['name'] ?? 'Người dùng',
        email: json['email'],
        role: json['role'] ?? 'customer',
      );
}

class AuthResponse {
  final bool success;
  final String message;
  final String token;
  final AuthUser user;

  AuthResponse({required this.success, required this.message, required this.token, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        success: json['success'] ?? false,
        message: json['message'] ?? '',
        token: json['data']?['token'] ?? json['token'] ?? '',
        user: AuthUser.fromJson(json['data']?['user'] ?? json['user'] ?? {}),
      );
}
