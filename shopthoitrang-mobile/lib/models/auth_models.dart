/// Model chuẩn theo bảng TAIKHOANKHACHHANG
/// - Mặc định map cả key UPPER_CASE (từ SQL) lẫn lowerCamelCase (từ API)
/// - Không chứa `pass` ở client model
class TaiKhoanKhachHang {
  final int maKhachHang;      // MAKHACHHANG
  final String hoTen;         // HOTEN
  final String tenDangNhap;   // TENDANGNHAP
  final String? email;        // EMAIL
  final String? soDienThoai;  // SODIENTHOAI
  final String? gioiTinh;     // GIOITINH: "Nam" | "Nữ" | "Khác"
  final DateTime? ngaySinh;   // NGAYSINH
  final bool dangHoatDong;    // DANGHOATDONG

  const TaiKhoanKhachHang({
    required this.maKhachHang,
    required this.hoTen,
    required this.tenDangNhap,
    this.email,
    this.soDienThoai,
    this.gioiTinh,
    this.ngaySinh,
    required this.dangHoatDong,
  });

  /// Hỗ trợ nhiều biến thể key từ API
  factory TaiKhoanKhachHang.fromJson(Map<String, dynamic> json) {
    // helper parse date
    DateTime? _parseDate(dynamic v) {
      if (v == null) return null;
      if (v is DateTime) return v;
      final s = v.toString();
      if (s.isEmpty) return null;
      // chấp nhận "YYYY-MM-DD" hoặc ISO8601
      return DateTime.tryParse(s);
    }

    // helper parse bool (true/false, 1/0, "true"/"false")
    bool _parseBool(dynamic v, {bool defaultValue = true}) {
      if (v == null) return defaultValue;
      if (v is bool) return v;
      if (v is num) return v != 0;
      final s = v.toString().toLowerCase().trim();
      if (s == 'true' || s == 't' || s == '1' || s == 'yes') return true;
      if (s == 'false' || s == 'f' || s == '0' || s == 'no') return false;
      return defaultValue;
    }

    int _int(dynamic v, {int defaultValue = 0}) {
      if (v == null) return defaultValue;
      if (v is int) return v;
      if (v is num) return v.toInt();
      return int.tryParse(v.toString()) ?? defaultValue;
    }

    String _str(dynamic v, {String defaultValue = ''}) {
      if (v == null) return defaultValue;
      return v.toString();
    }

    return TaiKhoanKhachHang(
      maKhachHang: _int(json['MAKHACHHANG'] ?? json['makhachhang'] ?? json['maKhachHang'] ?? json['id']),
      hoTen: _str(json['HOTEN'] ?? json['hoten'] ?? json['hoTen'] ?? json['name'], defaultValue: 'Người dùng'),
      tenDangNhap: _str(json['TENDANGNHAP'] ?? json['tendangnhap'] ?? json['tenDangNhap'] ?? json['username']),
      email: (json['EMAIL'] ?? json['email'])?.toString(),
      soDienThoai: (json['SODIENTHOAI'] ?? json['soDienThoai'] ?? json['sodienthoai'])?.toString(),
      gioiTinh: (json['GIOITINH'] ?? json['gioiTinh'] ?? json['gioitinh'])?.toString(),
      ngaySinh: _parseDate(json['NGAYSINH'] ?? json['ngaySinh'] ?? json['ngaysinh']),
      dangHoatDong: _parseBool(json['DANGHOATDONG'] ?? json['dangHoatDong'] ?? json['danghoatdong'], defaultValue: true),
    );
  }

  Map<String, dynamic> toJson({bool upperCaseKeys = false}) {
    final map = {
      'maKhachHang': maKhachHang,
      'hoTen': hoTen,
      'tenDangNhap': tenDangNhap,
      'email': email,
      'soDienThoai': soDienThoai,
      'gioiTinh': gioiTinh,
      'ngaySinh': ngaySinh?.toIso8601String(),
      'dangHoatDong': dangHoatDong,
    };

    if (!upperCaseKeys) return map;

    // xuất theo UPPER_CASE để phù hợp tên cột SQL (nếu backend cần)
    return {
      'MAKHACHHANG': maKhachHang,
      'HOTEN': hoTen,
      'TENDANGNHAP': tenDangNhap,
      'EMAIL': email,
      'SODIENTHOAI': soDienThoai,
      'GIOITINH': gioiTinh,
      'NGAYSINH': ngaySinh?.toIso8601String(),
      'DANGHOATDONG': dangHoatDong,
    };
  }

  TaiKhoanKhachHang copyWith({
    int? maKhachHang,
    String? hoTen,
    String? tenDangNhap,
    String? email,
    String? soDienThoai,
    String? gioiTinh,
    DateTime? ngaySinh,
    bool? dangHoatDong,
  }) {
    return TaiKhoanKhachHang(
      maKhachHang: maKhachHang ?? this.maKhachHang,
      hoTen: hoTen ?? this.hoTen,
      tenDangNhap: tenDangNhap ?? this.tenDangNhap,
      email: email ?? this.email,
      soDienThoai: soDienThoai ?? this.soDienThoai,
      gioiTinh: gioiTinh ?? this.gioiTinh,
      ngaySinh: ngaySinh ?? this.ngaySinh,
      dangHoatDong: dangHoatDong ?? this.dangHoatDong,
    );
  }
}

/// Nếu API đăng nhập vẫn trả về `token` + `user`,
/// ta định nghĩa AuthResponse trỏ tới TaiKhoanKhachHang
class AuthResponse {
  final bool success;
  final String message;
  final String token;
  final TaiKhoanKhachHang user;

  const AuthResponse({
    required this.success,
    required this.message,
    required this.token,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final data = (json['data'] is Map<String, dynamic>) ? json['data'] as Map<String, dynamic> : json;

    return AuthResponse(
      success: (json['success'] ?? json['ok'] ?? false) == true,
      message: (json['message'] ?? json['msg'] ?? '').toString(),
      token: (data['token'] ?? json['token'] ?? '').toString(),
      user: TaiKhoanKhachHang.fromJson(
        (data['user'] ?? json['user'] ?? data['khachhang'] ?? {}) as Map<String, dynamic>,
      ),
    );
  }
}
