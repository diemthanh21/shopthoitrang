/// Models for orders and order items.
import 'membership_model.dart';

/// Order model (donhang table)
class Order {
  final int? id; // madonhang
  final int customerId; // makhachhang
  final DateTime orderDate; // ngaydathang
  final DateTime? deliveredDate; // ngaygiaohang
  final double total; // thanhtien
  final String paymentMethod; // phuongthucthanhtoan
  final String paymentStatus; // trangthaithanhtoan
  final String orderStatus; // trangthaidonhang
  final List<OrderItem> items; // chitietdonhang
  final DiaChiKhachHang? shippingAddress; // dia chi giao hang
  final double shippingFee;
  final String? shippingProvinceSnapshot;
  final List<int> appliedVoucherIds;
  final int pointsUsed;
  final double pointsDiscountValue;

  Order({
    this.id,
    required this.customerId,
    required this.orderDate,
    this.deliveredDate,
    required this.total,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.orderStatus,
    this.items = const [],
    this.shippingAddress,
    this.shippingFee = 0,
    this.shippingProvinceSnapshot,
    this.appliedVoucherIds = const [],
    this.pointsUsed = 0,
    this.pointsDiscountValue = 0,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['madonhang'] ?? json['id'],
      customerId: json['makhachhang'] ?? json['customerId'] ?? 0,
      orderDate: json['ngaydathang'] != null
          ? DateTime.parse(json['ngaydathang'].toString())
          : DateTime.now(),
      deliveredDate: json['ngaygiaohang'] != null
          ? DateTime.parse(json['ngaygiaohang'].toString())
          : null,
      total: (json['thanhtien'] ?? 0).toDouble(),
      paymentMethod: json['phuongthucthanhtoan'] ?? json['paymentMethod'] ?? '',
      paymentStatus: json['trangthaithanhtoan'] ?? json['paymentStatus'] ?? '',
      orderStatus: json['trangthaidonhang'] ?? json['orderStatus'] ?? '',
      items: (json['items'] as List<dynamic>?)
              ?.map((item) => OrderItem.fromJson(item))
              .toList() ??
          [],
      shippingAddress: json['diaChi'] != null
          ? DiaChiKhachHang(
              maDiaChi: json['diaChi']['madiachi'],
              ten: json['diaChi']['ten'],
              soDienThoai: json['diaChi']['sodienthoai'],
              tinh: json['diaChi']['tinh'],
              phuong: json['diaChi']['phuong'],
              diaChiCuThe: json['diaChi']['diachicuthe'],
              diaChi: json['diaChi']['diachi'],
              macDinh: json['diaChi']['macdinh'] == true,
            )
          : null,
      shippingFee:
          _parseDouble(json['phivanchuyen'] ?? json['shippingFee'] ?? 0),
      shippingProvinceSnapshot: json['tinh_giaohang_snapshot'] ??
          json['shippingProvinceSnapshot'] ??
          json['shippingProvince'],
      appliedVoucherIds: _parseVoucherIds(json),
      pointsUsed: json['diem_su_dung'] ??
          json['pointsUsed'] ??
          json['points_used'] ??
          0,
      pointsDiscountValue:
          _parseDouble(json['points_discount_value'] ?? json['pointsDiscount'] ?? 0),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'madonhang': id,
      'makhachhang': customerId,
      'ngaydathang': orderDate.toIso8601String(),
      if (deliveredDate != null)
        'ngaygiaohang': deliveredDate!.toIso8601String(),
      'thanhtien': total,
      'phuongthucthanhtoan': paymentMethod,
      'trangthaithanhtoan': paymentStatus,
      'trangthaidonhang': orderStatus,
      if (items.isNotEmpty)
        'items': items.map((item) => item.toJson()).toList(),
      if (appliedVoucherIds.isNotEmpty) 'voucher_ids': appliedVoucherIds,
      if (pointsUsed > 0) ...{
        'diem_su_dung': pointsUsed,
        'pointsUsed': pointsUsed,
      },
      if (pointsDiscountValue > 0)
        'points_discount_value': pointsDiscountValue,
      if (shippingAddress != null) ...{
        'madiachi': shippingAddress!.maDiaChi,
        'diachi': {
          'madiachi': shippingAddress!.maDiaChi,
          'ten': shippingAddress!.ten,
          'sodienthoai': shippingAddress!.soDienThoai,
          'tinh': shippingAddress!.tinh,
          'phuong': shippingAddress!.phuong,
          'diachicuthe': shippingAddress!.diaChiCuThe,
          'diachi': shippingAddress!.diaChi,
          'macdinh': shippingAddress!.macDinh,
        }
      },
      'phivanchuyen': shippingFee,
      'tinh_giaohang_snapshot':
          shippingProvinceSnapshot ?? shippingAddress?.tinh,
    };
  }

  static List<int> _parseVoucherIds(Map<String, dynamic> json) {
    final result = <int>[];
    void addValue(dynamic value) {
      if (value == null) return;
      final parsed = value is int ? value : int.tryParse(value.toString());
      if (parsed != null && parsed > 0) result.add(parsed);
    }

    final candidates = [
      json['voucher_ids'],
      json['voucherIds'],
      json['appliedVoucherIds'],
      json['applied_voucher_ids'],
    ];
    for (final candidate in candidates) {
      if (candidate is List) {
        for (final value in candidate) {
          addValue(value);
        }
      }
    }

    if (json['appliedVouchers'] is List) {
      for (final item in json['appliedVouchers']) {
        if (item is Map<String, dynamic>) {
          addValue(item['mavoucher'] ?? item['maVoucher'] ?? item['id']);
        }
      }
    }

    return result;
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

/// Order item model (chitietdonhang table)
class OrderItem {
  final int? id; // machitietdonhang
  final int? orderId; // madonhang
  final int variantId; // machitietsanpham
  final int? productId; // masanpham (join)
  final int quantity; // soluong
  final double price; // dongia
  final String? productName; // tensanpham (join)
  final String? variantName; // phan loai (join)
  final String? imageUrl; // hinhanh (join)
  final int? sizeBridgeId; // chitietsize_id (chitietsanpham_kichthuoc.id)
  final int? giftVariantId;
  final int? giftSizeBridgeId;
  final int giftQuantity;
  final int? giftPromotionId;

  OrderItem({
    this.id,
    this.orderId,
    required this.variantId,
    this.productId,
    required this.quantity,
    required this.price,
    this.productName,
    this.variantName,
    this.imageUrl,
    this.sizeBridgeId,
    this.giftVariantId,
    this.giftSizeBridgeId,
    this.giftQuantity = 0,
    this.giftPromotionId,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    // Extract variant info if exists
    final variant = json['variant'] as Map<String, dynamic>?;
    String? variantText;
    if (variant != null) {
      final color = variant['color'];
      final size = variant['size'];
      if (color != null && size != null) {
        variantText = '$color, $size';
      } else if (color != null) {
        variantText = color;
      } else if (size != null) {
        variantText = size;
      }
    }

    // productId might come from enriched variant
    final int? productId = json['masanpham'] ?? json['productId'];

    return OrderItem(
      id: json['machitietdonhang'] ?? json['id'],
      orderId: json['madonhang'] ?? json['orderId'],
      variantId: json['machitietsanpham'] ?? json['variantId'] ?? 0,
      productId: productId,
      quantity: json['soluong'] ?? json['quantity'] ?? 0,
      price: (json['dongia'] ?? json['price'] ?? 0).toDouble(),
      productName: json['productName'] ?? json['tensanpham'],
      variantName: variantText ?? json['variantName'],
      imageUrl: json['imageUrl'] ?? json['hinhanh'],
      sizeBridgeId: json['sizeBridgeId'] ??
          json['chitietsize_id'] ??
          json['chitietsizeId'],
      giftVariantId: json['giftVariantId'] ?? json['gift_variant_id'],
      giftSizeBridgeId: json['giftSizeBridgeId'] ?? json['gift_size_bridge_id'],
      giftQuantity: json['giftQuantity'] ?? json['gift_quantity'] ?? 0,
      giftPromotionId: json['giftPromotionId'] ?? json['gift_promotion_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'machitietdonhang': id,
      if (orderId != null) 'madonhang': orderId,
      'machitietsanpham': variantId,
      if (productId != null) 'masanpham': productId,
      'soluong': quantity,
      'dongia': price,
      if (productName != null) 'tensanpham': productName,
      if (variantName != null) 'variantName': variantName,
      if (imageUrl != null) 'hinhanh': imageUrl,
      if (sizeBridgeId != null) 'chitietsizeId': sizeBridgeId,
      if (giftVariantId != null) 'giftVariantId': giftVariantId,
      if (giftSizeBridgeId != null) 'giftSizeBridgeId': giftSizeBridgeId,
      if (giftQuantity > 0) 'giftQuantity': giftQuantity,
      if (giftPromotionId != null) 'giftPromotionId': giftPromotionId,
    };
  }

  double get total => price * quantity;
}

/// Simple shipping address model (legacy; main address type is DiaChiKhachHang)
class ShippingAddress {
  final int? id; // madiachi
  final int customerId; // makhachhang
  final String address; // diachi

  ShippingAddress({
    this.id,
    required this.customerId,
    required this.address,
  });

  factory ShippingAddress.fromJson(Map<String, dynamic> json) {
    return ShippingAddress(
      id: json['madiachi'] ?? json['id'],
      customerId: json['makhachhang'] ?? json['customerId'] ?? 0,
      address: json['diachi'] ?? json['address'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'madiachi': id,
      'makhachhang': customerId,
      'diachi': address,
    };
  }
}
