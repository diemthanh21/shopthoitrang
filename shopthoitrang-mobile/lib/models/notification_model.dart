class PromotionNotification {
  final int id;
  final String title;
  final String message;
  final String? programName;
  final String? imageUrl;
  final String? voucherCode;
  final double? discountPercent;
  final double? discountAmount;
  final double? maxDiscountAmount;
  final double? minOrderAmount;
  final int? totalQuantity;
  final int? usedQuantity;
  final int? remainingQuantity;
  final String? discountType;
  final bool? birthdayOnly;
  final String? staffName;
  final DateTime? validFrom;
  final DateTime? validUntil;
  final DateTime createdAt;
  final bool isRead;

  const PromotionNotification({
    required this.id,
    required this.title,
    required this.message,
    this.programName,
    this.imageUrl,
    this.voucherCode,
    this.discountPercent,
    this.discountAmount,
    this.maxDiscountAmount,
    this.minOrderAmount,
    this.totalQuantity,
    this.usedQuantity,
    this.remainingQuantity,
    this.discountType,
    this.birthdayOnly,
    this.staffName,
    this.validFrom,
    this.validUntil,
    required this.createdAt,
    this.isRead = false,
  });

  factory PromotionNotification.fromJson(Map<String, dynamic> json) {
    double? parseDouble(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toDouble();
      return double.tryParse(value.toString());
    }

    int? parseInt(dynamic value) {
      if (value == null) return null;
      if (value is int) return value;
      if (value is num) return value.toInt();
      return int.tryParse(value.toString());
    }

    bool? parseBool(dynamic value) {
      if (value == null) return null;
      if (value is bool) return value;
      final lowered = value.toString().toLowerCase();
      if (lowered == 'true' || lowered == '1') return true;
      if (lowered == 'false' || lowered == '0') return false;
      return null;
    }

    DateTime? parseDate(dynamic value) {
      if (value == null) return null;
      try {
        return DateTime.parse(value.toString());
      } catch (_) {
        return null;
      }
    }

    final programName = (json['tenmagiamgia'] ??
            json['tenMaGiamGia'] ??
            json['tenchuongtrinh'] ??
            json['tenChuongTrinh'])
        ?.toString()
        .trim();

    final resolvedTitle = (json['title'] ??
            json['tieude'] ??
            programName ??
            'Khuyen mai')
        .toString();

    final discountPercent = json['discountPercent'] != null
        ? (json['discountPercent'] as num).toDouble()
        : (json['phantramgiam'] != null
            ? (json['phantramgiam'] as num).toDouble()
            : parseDouble(json['phantram_giam']));

    final discountAmount = json['discountAmount'] != null
        ? (json['discountAmount'] as num).toDouble()
        : (json['sotiengiam'] != null
            ? (json['sotiengiam'] as num).toDouble()
            : (json['sotien_giam'] != null
                ? (json['sotien_giam'] as num).toDouble()
                : parseDouble(json['giatrigiam'])));

    final maxDiscount = parseDouble(json['giam_toi_da']);
    final minOrder = parseDouble(json['dieukien_don_toi_thieu']);
    final totalQty = parseInt(json['soluong']);
    final usedQty = parseInt(json['soluong_da_dung']);
    final computedRemaining = (totalQty != null && usedQty != null)
        ? ((totalQty - usedQty) < 0 ? 0 : (totalQty - usedQty))
        : null;
    final remainingQty = json['soluong_con_lai'] != null
        ? parseInt(json['soluong_con_lai'])
        : computedRemaining;

    final typeRaw = (json['hinhthuc_giam'] ??
            json['hinhThucGiam'] ??
            json['loaikhuyenmai'] ??
            json['loai'])
        ?.toString()
        .toUpperCase();

    return PromotionNotification(
      id: json['id'] ??
          json['makhuyenmai'] ??
          json['mavoucher'] ??
          json['maVoucher'] ??
          0,
      title: resolvedTitle.isNotEmpty ? resolvedTitle : 'Khuyen mai',
      message:
          (json['message'] ?? json['noidung'] ?? json['mota'] ?? '').toString(),
      programName:
          (programName != null && programName.isNotEmpty) ? programName : null,
      imageUrl: json['imageUrl'] ?? json['hinhanh'],
      voucherCode: (json['voucherCode'] ??
              json['mavoucher'] ??
              json['maVoucher'] ??
              json['macode'] ??
              json['code'])
          ?.toString(),
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      maxDiscountAmount: maxDiscount,
      minOrderAmount: minOrder,
      totalQuantity: totalQty,
      usedQuantity: usedQty,
      remainingQuantity: remainingQty,
      discountType: typeRaw,
      birthdayOnly:
          parseBool(json['chi_ap_dung_sinhnhat'] ?? json['chiApDungSinhNhat']),
      staffName:
          (json['manhanvien'] ?? json['nhanvien'] ?? json['nhanVien'])?.toString(),
      validFrom: parseDate(
          json['validFrom'] ?? json['ngaybatdau'] ?? json['ngayBatDau']),
      validUntil: parseDate(
          json['validUntil'] ?? json['ngayketthuc'] ?? json['ngayKetThuc']),
      createdAt: parseDate(json['createdAt'] ?? json['created_at']) ??
          parseDate(json['ngaytao']) ??
          DateTime.now(),
      isRead: json['isRead'] ?? json['dadoc'] ?? false,
    );
  }

  PromotionNotification copyWith({bool? isRead}) {
    return PromotionNotification(
      id: id,
      title: title,
      message: message,
      programName: programName,
      imageUrl: imageUrl,
      voucherCode: voucherCode,
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      maxDiscountAmount: maxDiscountAmount,
      minOrderAmount: minOrderAmount,
      totalQuantity: totalQuantity,
      usedQuantity: usedQuantity,
      remainingQuantity: remainingQuantity,
      discountType: discountType,
      birthdayOnly: birthdayOnly,
      staffName: staffName,
      validFrom: validFrom,
      validUntil: validUntil,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
    );
  }
}

class OrderNotification {
  final int orderId;
  final String orderCode;
  final String status;
  final String? message;
  final double totalAmount;
  final DateTime orderDate;
  final DateTime? statusUpdatedAt;
  final bool isRead;

  OrderNotification({
    required this.orderId,
    required this.orderCode,
    required this.status,
    this.message,
    required this.totalAmount,
    required this.orderDate,
    this.statusUpdatedAt,
    this.isRead = false,
  });

  factory OrderNotification.fromJson(Map<String, dynamic> json) {
    final orderId = json['madonhang'] ?? json['maDonHang'] ?? json['id'] ?? 0;
    final status = json['trangthaidonhang'] ??
        json['trangThaiDonHang'] ??
        json['status'] ??
        'Dang xu ly';

    String defaultMessage;
    switch (status) {
      case 'Cho xac nhan':
        defaultMessage =
            'Don hang cua ban dang cho shop xac nhan.';
        break;
      case 'Da xac nhan':
      case 'Dang xu ly':
        defaultMessage = 'Shop dang chuan bi don hang cua ban.';
        break;
      case 'Dang giao':
        defaultMessage = 'Don hang dang duoc giao. Vui long theo doi.';
        break;
      case 'Da giao':
        defaultMessage =
            'Don hang da giao thanh cong. Cam on ban da mua sam!';
        break;
      case 'Da huy':
        defaultMessage = 'Don hang da bi huy.';
        break;
      default:
        defaultMessage = 'Cap nhat moi ve don hang cua ban.';
    }

    double parseAmount(dynamic value) {
      if (value is num) return value.toDouble();
      return double.tryParse(value?.toString() ?? '') ?? 0.0;
    }

    DateTime parseDate(dynamic value) {
      if (value == null) return DateTime.now();
      try {
        return DateTime.parse(value.toString());
      } catch (_) {
        return DateTime.now();
      }
    }

    return OrderNotification(
      orderId: orderId,
      orderCode: '#$orderId',
      status: status,
      message: json['message'] ?? json['noidung'] ?? defaultMessage,
      totalAmount: json['thanhtien'] != null
          ? parseAmount(json['thanhtien'])
          : (json['thanhTien'] != null
              ? parseAmount(json['thanhTien'])
              : 0.0),
      orderDate: parseDate(json['ngaydathang'] ?? json['ngayDatHang']),
      statusUpdatedAt:
          json['statusUpdatedAt'] != null || json['ngaycapnhat'] != null
              ? parseDate(json['statusUpdatedAt'] ?? json['ngaycapnhat'])
              : null,
      isRead: json['isRead'] ?? json['dadoc'] ?? false,
    );
  }

  OrderNotification copyWith({bool? isRead}) {
    return OrderNotification(
      orderId: orderId,
      orderCode: orderCode,
      status: status,
      message: message,
      totalAmount: totalAmount,
      orderDate: orderDate,
      statusUpdatedAt: statusUpdatedAt,
      isRead: isRead ?? this.isRead,
    );
  }
}
