// Model cho Thẻ thành viên
class TheThanhVien {
  final int? maThe;
  final int? maKhachHang;
  final int? maHangThe;
  final DateTime? ngayCap;
  final DateTime? ngayHetHan;
  final String? trangThai;

  // Thông tin hạng thẻ
  String? tenHang;
  double? giamGia;
  String? voucherSinhNhat;
  String? uuDai;

  TheThanhVien({
    this.maThe,
    this.maKhachHang,
    this.maHangThe,
    this.ngayCap,
    this.ngayHetHan,
    this.trangThai,
    this.tenHang,
    this.giamGia,
    this.voucherSinhNhat,
    this.uuDai,
  });

  factory TheThanhVien.fromJson(Map<String, dynamic> json) {
    return TheThanhVien(
      maThe: json['mathe'],
      maKhachHang: json['makhachhang'],
      maHangThe: json['mahangthe'],
      ngayCap: json['ngaycap'] != null ? DateTime.parse(json['ngaycap']) : null,
      ngayHetHan: json['ngayhethan'] != null
          ? DateTime.parse(json['ngayhethan'])
          : null,
      trangThai: json['trangthai'],
      tenHang: json['tenhang'],
      giamGia: json['giamgia']?.toDouble(),
      voucherSinhNhat: json['voucher_sinhnhat'],
      uuDai: json['uudai'],
    );
  }
}

// Model cho Tích lũy chi tiêu
class TichLuyChiTieu {
  final int? id;
  final int? maKhachHang;
  final int? nam;
  final double? tongChiNam;
  final double? tongChiTichLuy;
  final DateTime? ngayCapNhat;

  TichLuyChiTieu({
    this.id,
    this.maKhachHang,
    this.nam,
    this.tongChiNam,
    this.tongChiTichLuy,
    this.ngayCapNhat,
  });

  factory TichLuyChiTieu.fromJson(Map<String, dynamic> json) {
    return TichLuyChiTieu(
      id: json['id'],
      maKhachHang: json['makh'],
      nam: json['nam'],
      tongChiNam: json['tongchi_nam']?.toDouble(),
      tongChiTichLuy: json['tongchi_tichluy']?.toDouble(),
      ngayCapNhat: json['ngaycapnhat'] != null
          ? DateTime.parse(json['ngaycapnhat'])
          : null,
    );
  }
}

// Model cho Địa chỉ khách hàng
class DiaChiKhachHang {
  final int? maDiaChi;
  final int? maKhachHang;
  final String? diaChi; // Backward compatibility
  final String? ten;
  final String? soDienThoai;
  final String? tinh;
  final String? phuong;
  final String? diaChiCuThe;
  final bool? macDinh;

  DiaChiKhachHang({
    this.maDiaChi,
    this.maKhachHang,
    this.diaChi,
    this.ten,
    this.soDienThoai,
    this.tinh,
    this.phuong,
    this.diaChiCuThe,
    this.macDinh,
  });

  factory DiaChiKhachHang.fromJson(Map<String, dynamic> json) {
    return DiaChiKhachHang(
      maDiaChi: json['madiachi'],
      maKhachHang: json['makhachhang'],
      diaChi: json['diachi'],
      ten: json['ten'],
      soDienThoai: json['sodienthoai'],
      tinh: json['tinh'],
      phuong: json['phuong'],
      diaChiCuThe: json['diachicuthe'],
      macDinh: json['macdinh'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'madiachi': maDiaChi,
      'makhachhang': maKhachHang,
      'ten': ten,
      'sodienthoai': soDienThoai,
      'tinh': tinh,
      'phuong': phuong,
      'diachicuthe': diaChiCuThe,
      'macdinh': macDinh,
    };
  }

  // Helper để lấy địa chỉ đầy đủ
  String get diaChiDayDu {
    if (ten != null && tinh != null) {
      return '$diaChiCuThe, $phuong, $tinh';
    }
    // Fallback to old format
    return diaChi ?? '';
  }
}
