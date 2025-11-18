class User {
  final int id; // makhachhang
  final String? fullName; // hoten
  final String username; // tendangnhap
  final String? email;
  final String? phone; // sodienthoai
  final String? gender; // gioitinh
  final String? birthDate; // ngaysinh
  final bool isActive; // danghoatdong

  User({
    required this.id,
    required this.username,
    this.fullName,
    this.email,
    this.phone,
    this.gender,
    this.birthDate,
    this.isActive = true,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['makhachhang'] ?? json['id'] ?? 0,
      fullName: json['hoten']?.toString(),
      username: json['tendangnhap'] ?? '',
      email: json['email']?.toString(),
      phone: json['sodienthoai']?.toString(),
      gender: json['gioitinh']?.toString(),
      birthDate: json['ngaysinh']?.toString(),
      isActive: json['danghoatdong'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'makhachhang': id,
      'hoten': fullName,
      'tendangnhap': username,
      'email': email,
      'sodienthoai': phone,
      'gioitinh': gender,
      'ngaysinh': birthDate,
      'danghoatdong': isActive,
    };
  }

  String get displayName => fullName ?? username;

  String get displayPhone => phone ?? 'Chưa cập nhật';
}
