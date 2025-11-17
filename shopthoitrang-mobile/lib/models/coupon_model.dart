import 'dart:math' as math;

/// Data model for discount vouchers (mã giảm giá / magiamgia table).
class Coupon {
  final int? id;
  final String code;
  final String? description;
  final String discountType; // AMOUNT | PERCENT | FREESHIP
  final double? fixedAmount; // for AMOUNT
  final double? percent; // for PERCENT
  final double? maxDiscountAmount; // cap for PERCENT / FREESHIP
  final double? minOrderValue;
  final DateTime? startDate;
  final DateTime? endDate;
  final int totalQuantity;
  final int usedQuantity;
  final bool birthdayOnly;

  const Coupon({
    this.id,
    required this.code,
    this.description,
    required this.discountType,
    this.fixedAmount,
    this.percent,
    this.maxDiscountAmount,
    this.minOrderValue,
    this.startDate,
    this.endDate,
    this.totalQuantity = 0,
    this.usedQuantity = 0,
    this.birthdayOnly = false,
  });

  factory Coupon.fromJson(Map<String, dynamic> json) {
    double? parseDouble(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toDouble();
      return double.tryParse(value.toString());
    }

    int parseInt(dynamic value) {
      if (value == null) return 0;
      if (value is num) return value.toInt();
      return int.tryParse(value.toString()) ?? 0;
    }

    bool parseBool(dynamic value) {
      if (value is bool) return value;
      if (value is String) {
        return value.toLowerCase() == 'true' || value == '1';
      }
      if (value is num) return value != 0;
      return false;
    }

    DateTime? parseDate(dynamic value) {
      if (value == null) return null;
      if (value is DateTime) return value;
      try {
        return DateTime.parse(value.toString());
      } catch (_) {
        return null;
      }
    }

    final rawType = (json['hinhthuc_giam'] ??
            json['hinhThucGiam'] ??
            json['hinhthucGiam'] ??
            'AMOUNT')
        .toString()
        .toUpperCase();

    return Coupon(
      id: json['mavoucher'] ?? json['maVoucher'] ?? json['id'],
      code: (json['macode'] ?? json['maCode'] ?? json['code'] ?? '').toString(),
      description: json['mota']?.toString() ?? json['moTa']?.toString(),
      discountType: rawType,
      fixedAmount: parseDouble(
        json['sotien_giam'] ?? json['giaTriGiam'] ?? json['giatrigiam'],
      ),
      percent: parseDouble(json['phantram_giam'] ?? json['phanTramGiam']),
      maxDiscountAmount:
          parseDouble(json['giam_toi_da'] ?? json['giamToiDa'] ?? json['cap']),
      minOrderValue: parseDouble(
        json['dieukien_don_toi_thieu'] ?? json['dieuKienDonToiThieu'],
      ),
      startDate: parseDate(json['ngaybatdau'] ?? json['ngayBatDau']),
      endDate: parseDate(json['ngayketthuc'] ?? json['ngayKetThuc']),
      totalQuantity: parseInt(json['soluong'] ?? json['soLuong']),
      usedQuantity: parseInt(
        json['soluong_da_dung'] ?? json['soLuongDaDung'] ?? json['used'],
      ),
      birthdayOnly:
          parseBool(json['chi_ap_dung_sinhnhat'] ?? json['chiApDungSinhNhat']),
    );
  }

  int get remainingQuantity =>
      math.max(0, totalQuantity - math.max(0, usedQuantity));

  bool get hasQuantity => remainingQuantity > 0 || totalQuantity == 0;

  bool get isInDateRange {
    final now = DateTime.now();
    if (startDate != null && now.isBefore(startDate!)) return false;
    if (endDate != null && now.isAfter(endDate!)) return false;
    return true;
  }

  bool get isActive => hasQuantity && isInDateRange;

  bool canApplyTo(double subtotal) {
    if (!isActive) return false;
    if (minOrderValue != null && subtotal < minOrderValue!) return false;
    return true;
  }

  double calculateDiscount(double subtotal, double shippingFee) {
    if (!canApplyTo(subtotal)) return 0;
    switch (discountType) {
      case 'PERCENT':
        final percentValue = percent ?? 0;
        if (percentValue <= 0) return 0;
        final raw = subtotal * percentValue / 100;
        final cap = maxDiscountAmount;
        if (cap != null && cap > 0) {
          return math.min(raw, cap);
        }
        return raw;
      case 'FREESHIP':
        if (shippingFee <= 0) return 0;
        final cap = maxDiscountAmount;
        final maxValue = cap != null && cap > 0 ? math.min(cap, shippingFee) : shippingFee;
        return maxValue;
      default: // AMOUNT
        final amount = fixedAmount ?? 0;
        if (amount <= 0) return 0;
        return math.min(amount, subtotal);
    }
  }

  String get typeLabel {
    switch (discountType) {
      case 'PERCENT':
        return 'Giảm %';
      case 'FREESHIP':
        return 'Freeship';
      default:
        return 'Giảm tiền';
    }
  }
}
