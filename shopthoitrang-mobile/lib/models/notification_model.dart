/// Model cho thông báo khuyến mãi/voucher
class PromotionNotification {
  final int id;
  final String title;
  final String message;
  final String? imageUrl;
  final String? voucherCode;
  final double? discountPercent;
  final double? discountAmount;
  final DateTime? validFrom;
  final DateTime? validUntil;
  final DateTime createdAt;
  final bool isRead;

  PromotionNotification({
    required this.id,
    required this.title,
    required this.message,
    this.imageUrl,
    this.voucherCode,
    this.discountPercent,
    this.discountAmount,
    this.validFrom,
    this.validUntil,
    required this.createdAt,
    this.isRead = false,
  });

  factory PromotionNotification.fromJson(Map<String, dynamic> json) {
    return PromotionNotification(
      id: json['id'] ?? json['makhuyenmai'] ?? 0,
      title: json['title'] ??
          json['tieude'] ??
          json['tenchuongtrinh'] ??
          'Khuyến mãi',
      message: json['message'] ?? json['noidung'] ?? json['mota'] ?? '',
      imageUrl: json['imageUrl'] ?? json['hinhanh'],
      voucherCode: json['voucherCode'] ?? json['mavoucher'] ?? json['code'],
      discountPercent: json['discountPercent'] != null
          ? (json['discountPercent'] as num).toDouble()
          : (json['phantramgiam'] != null
              ? (json['phantramgiam'] as num).toDouble()
              : null),
      discountAmount: json['discountAmount'] != null
          ? (json['discountAmount'] as num).toDouble()
          : (json['sotiengiam'] != null
              ? (json['sotiengiam'] as num).toDouble()
              : null),
      validFrom: json['validFrom'] != null
          ? DateTime.parse(json['validFrom'])
          : (json['ngaybatdau'] != null
              ? DateTime.parse(json['ngaybatdau'])
              : null),
      validUntil: json['validUntil'] != null
          ? DateTime.parse(json['validUntil'])
          : (json['ngayketthuc'] != null
              ? DateTime.parse(json['ngayketthuc'])
              : null),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : (json['ngaytao'] != null
              ? DateTime.parse(json['ngaytao'])
              : DateTime.now()),
      isRead: json['isRead'] ?? json['dadoc'] ?? false,
    );
  }

  PromotionNotification copyWith({bool? isRead}) {
    return PromotionNotification(
      id: id,
      title: title,
      message: message,
      imageUrl: imageUrl,
      voucherCode: voucherCode,
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      validFrom: validFrom,
      validUntil: validUntil,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
    );
  }
}

/// Model cho thông báo cập nhật đơn hàng
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
        'Đang xử lý';

    // Tạo message dựa trên trạng thái
    String defaultMessage;
    switch (status) {
      case 'Chờ xác nhận':
        defaultMessage = 'Đơn hàng của bạn đang chờ xác nhận từ shop';
        break;
      case 'Đã xác nhận':
      case 'Đang xử lý':
        defaultMessage = 'Shop đang chuẩn bị đơn hàng của bạn';
        break;
      case 'Đang giao':
        defaultMessage = 'Đơn hàng đang được giao. Dự kiến giao trong hôm nay';
        break;
      case 'Đã giao':
        defaultMessage =
            'Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua hàng!';
        break;
      case 'Đã hủy':
        defaultMessage = 'Đơn hàng đã bị hủy';
        break;
      default:
        defaultMessage = 'Có cập nhật mới về đơn hàng của bạn';
    }

    return OrderNotification(
      orderId: orderId,
      orderCode: '#$orderId',
      status: status,
      message: json['message'] ?? json['noidung'] ?? defaultMessage,
      totalAmount: json['thanhtien'] != null
          ? (json['thanhtien'] as num).toDouble()
          : (json['thanhTien'] != null
              ? (json['thanhTien'] as num).toDouble()
              : 0.0),
      orderDate: json['ngaydathang'] != null
          ? DateTime.parse(json['ngaydathang'])
          : (json['ngayDatHang'] != null
              ? DateTime.parse(json['ngayDatHang'])
              : DateTime.now()),
      statusUpdatedAt: json['statusUpdatedAt'] != null
          ? DateTime.parse(json['statusUpdatedAt'])
          : (json['ngaycapnhat'] != null
              ? DateTime.parse(json['ngaycapnhat'])
              : null),
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
