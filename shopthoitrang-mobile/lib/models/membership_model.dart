// Model cho Thẻ thành viên (V2 - chỉ tích điểm)
class TheThanhVien {
  final int? maThe;
  final int? maKhachHang;
  final DateTime? ngayCap;
  final bool? trangThai;

  // Thông tin điểm tích lũy
  final double? diemHienTai;
  final double? diemPending;
  final double? diemNamHienTai;
  final int? namDiem;
  final DateTime? lastResetAt;

  TheThanhVien({
    this.maThe,
    this.maKhachHang,
    this.ngayCap,
    this.trangThai,
    this.diemHienTai,
    this.diemPending,
    this.diemNamHienTai,
    this.namDiem,
    this.lastResetAt,
  });

  factory TheThanhVien.fromJson(Map<String, dynamic> json) {
    return TheThanhVien(
      maThe: json['mathe'],
      maKhachHang: json['makhachhang'],
      ngayCap: json['ngaycap'] != null ? DateTime.parse(json['ngaycap']) : null,
      trangThai: json['trangthai'],
      diemHienTai: json['diem_hien_tai']?.toDouble(),
      diemPending: json['diem_pending']?.toDouble(),
      diemNamHienTai: json['diem_nam_hien_tai']?.toDouble(),
      namDiem: json['nam_diem'],
      lastResetAt: json['last_reset_at'] != null
          ? DateTime.parse(json['last_reset_at'])
          : null,
    );
  }
}

// Model cho giao dịch điểm pending
class PendingPointTransaction {
  final double? diem;
  final int? maDonHang;
  final DateTime? availableAt;
  final String? note;

  PendingPointTransaction({
    this.diem,
    this.maDonHang,
    this.availableAt,
    this.note,
  });

  factory PendingPointTransaction.fromJson(Map<String, dynamic> json) {
    return PendingPointTransaction(
      diem: json['diem']?.toDouble(),
      maDonHang: json['madonhang'],
      availableAt: json['available_at'] != null
          ? DateTime.parse(json['available_at'])
          : null,
      note: json['note'],
    );
  }
}

// Model cho tổng hợp điểm
class PointsSummary {
  final double diemHienTai;
  final double diemPending;
  final double diemNamHienTai;
  final int? namDiem;
  final DateTime? lastResetAt;
  final List<PendingPointTransaction> pendingTransactions;

  PointsSummary({
    required this.diemHienTai,
    required this.diemPending,
    required this.diemNamHienTai,
    this.namDiem,
    this.lastResetAt,
    this.pendingTransactions = const [],
  });

  factory PointsSummary.fromJson(Map<String, dynamic> json) {
    List<PendingPointTransaction> transactions = [];
    if (json['pending_transactions'] != null) {
      transactions = (json['pending_transactions'] as List)
          .map((tx) => PendingPointTransaction.fromJson(tx))
          .toList();
    }

    return PointsSummary(
      diemHienTai: json['diem_hien_tai']?.toDouble() ?? 0,
      diemPending: json['diem_pending']?.toDouble() ?? 0,
      diemNamHienTai: json['diem_nam_hien_tai']?.toDouble() ?? 0,
      namDiem: json['nam_diem'],
      lastResetAt: json['last_reset_at'] != null
          ? DateTime.parse(json['last_reset_at'])
          : null,
      pendingTransactions: transactions,
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
