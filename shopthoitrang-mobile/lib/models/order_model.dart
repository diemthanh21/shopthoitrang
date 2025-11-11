/// Model đơn hàng (donhang table)
import 'membership_model.dart';

class Order {
  final int? id; // madonhang
  final int customerId; // makhachhang
  final DateTime orderDate; // ngaydathang
  final DateTime? deliveredDate; // ngaygiaohang - thời điểm xác nhận đã giao
  final double total; // thanhtien
  final String paymentMethod; // phuongthucthanhtoan
  final String paymentStatus; // trangthaithanhtoan
  final String orderStatus; // trangthaidonhang
  final List<OrderItem> items; // chitietdonhang
  final DiaChiKhachHang? shippingAddress; // địa chỉ giao đã chọn lúc checkout

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
    };
  }
}

/// Model chi tiết đơn hàng (chitietdonhang table)
class OrderItem {
  final int? id; // machitietdonhang
  final int? orderId; // madonhang
  final int variantId; // machitietsanpham
  final int? productId; // masanpham (từ join)
  final int quantity; // soluong
  final double price; // dongia
  final String? productName; // tensanpham (từ join)
  final String? variantName; // tên phân loại (từ join)
  final String? imageUrl; // hinhanh (từ join)

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

    // Server trả về productId từ variant enrichment
    // Nếu không có thì cần query riêng (nhưng thường có)
    int? productId = json['masanpham'] ?? json['productId'];

    // WORKAROUND: Nếu server không trả productId, cần lấy từ API khác
    // Hoặc yêu cầu server thêm masanpham vào response items
    // Tạm thời để null nếu không có

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
    };
  }

  double get total => price * quantity;
}

/// Model địa chỉ khách hàng (diachikhachhang table)
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
