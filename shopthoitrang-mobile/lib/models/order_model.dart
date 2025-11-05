/// Model đơn hàng (donhang table)
class Order {
  final int? id; // madonhang
  final int customerId; // makhachhang
  final DateTime orderDate; // ngaydathang
  final double total; // thanhtien
  final String paymentMethod; // phuongthucthanhtoan
  final String paymentStatus; // trangthaithanhtoan
  final String orderStatus; // trangthaidonhang
  final List<OrderItem> items; // chitietdonhang

  Order({
    this.id,
    required this.customerId,
    required this.orderDate,
    required this.total,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.orderStatus,
    this.items = const [],
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['madonhang'] ?? json['id'],
      customerId: json['makhachhang'] ?? json['customerId'] ?? 0,
      orderDate: json['ngaydathang'] != null
          ? DateTime.parse(json['ngaydathang'].toString())
          : DateTime.now(),
      total: (json['thanhtien'] ?? 0).toDouble(),
      paymentMethod: json['phuongthucthanhtoan'] ?? json['paymentMethod'] ?? '',
      paymentStatus: json['trangthaithanhtoan'] ?? json['paymentStatus'] ?? '',
      orderStatus: json['trangthaidonhang'] ?? json['orderStatus'] ?? '',
      items: (json['items'] as List<dynamic>?)
              ?.map((item) => OrderItem.fromJson(item))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'madonhang': id,
      'makhachhang': customerId,
      'ngaydathang': orderDate.toIso8601String(),
      'thanhtien': total,
      'phuongthucthanhtoan': paymentMethod,
      'trangthaithanhtoan': paymentStatus,
      'trangthaidonhang': orderStatus,
      if (items.isNotEmpty)
        'items': items.map((item) => item.toJson()).toList(),
    };
  }
}

/// Model chi tiết đơn hàng (chitietdonhang table)
class OrderItem {
  final int? id; // machitietdonhang
  final int? orderId; // madonhang
  final int variantId; // machitietsanpham
  final int quantity; // soluong
  final double price; // dongia

  OrderItem({
    this.id,
    this.orderId,
    required this.variantId,
    required this.quantity,
    required this.price,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['machitietdonhang'] ?? json['id'],
      orderId: json['madonhang'] ?? json['orderId'],
      variantId: json['machitietsanpham'] ?? json['variantId'] ?? 0,
      quantity: json['soluong'] ?? json['quantity'] ?? 0,
      price: (json['dongia'] ?? json['price'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'machitietdonhang': id,
      if (orderId != null) 'madonhang': orderId,
      'machitietsanpham': variantId,
      'soluong': quantity,
      'dongia': price,
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
