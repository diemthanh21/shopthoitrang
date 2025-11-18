class Review {
  final int? id;
  final int productId;
  final int customerId;
  final int? staffId;
  final int? orderDetailId;
  final int? orderId;
  final int rating;
  final String? comment;
  final String? images;
  final String? shopReply;
  final DateTime? reviewDate;

  // Thông tin khách hàng (từ join)
  final String? customerName;
  final String? customerImage;

  // Thông tin sản phẩm (từ join)
  final String? productName;
  final String? productImage;

  // Thông tin variant (size, màu) - từ chitietdonhang
  final String? variantSize;
  final String? variantColor;
  final String? variantImage;

  Review({
    this.id,
    required this.productId,
    required this.customerId,
    this.staffId,
    this.orderDetailId,
    this.orderId,
    required this.rating,
    this.comment,
    this.images,
    this.shopReply,
    this.reviewDate,
    this.customerName,
    this.customerImage,
    this.productName,
    this.productImage,
    this.variantSize,
    this.variantColor,
    this.variantImage,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    // Be tolerant of different API field names and types
    final dynamic ratingRaw = json['diemdanhgia'];
    final int ratingParsed = ratingRaw is int
        ? ratingRaw
        : int.tryParse(ratingRaw?.toString() ?? '') ?? 0;

    // Name fallbacks: the server enriches as 'tenkhachhang',
    // but older payloads might expose 'hoten', 'tendangnhap', or 'email'.
    final String? name = (json['tenkhachhang'] ??
            json['hoten'] ??
            json['tendangnhap'] ??
            json['username'] ??
            json['email'])
        ?.toString();

    // Customer image fallbacks
    final String? customerImg = (json['hinhanhkhachhang'] ??
            json['avatar'] ??
            json['anhdaidien'] ??
            json['hinhanh'])
        ?.toString();

    return Review(
      id: json['madanhgia'],
      productId: json['masanpham'],
      customerId: json['makhachhang'],
      staffId: json['manhanvien'],
      orderDetailId: json['machitietdonhang'],
      orderId: json['madonhang'] ?? json['orderId'],
      rating: ratingParsed,
      comment: json['binhluan'],
      images: json['hinhanh'],
      shopReply: json['phanhoitushop'],
      reviewDate: json['ngaydanhgia'] != null
          ? DateTime.tryParse(json['ngaydanhgia'].toString())
          : null,
      customerName: name,
      customerImage: customerImg,
      productName: json['tensanpham'],
      productImage: json['hinhanhsanpham'],
      variantSize: json['kichco'],
      variantColor: json['mausac'],
      variantImage: json['hinhanhbienthe'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'madanhgia': id,
      'masanpham': productId,
      'makhachhang': customerId,
      if (staffId != null) 'manhanvien': staffId,
      if (orderDetailId != null) 'machitietdonhang': orderDetailId,
      'diemdanhgia': rating,
      if (comment != null) 'binhluan': comment,
      if (images != null) 'hinhanh': images,
      if (shopReply != null) 'phanhoitushop': shopReply,
      if (reviewDate != null) 'ngaydanhgia': reviewDate!.toIso8601String(),
    };
  }

  List<String> get imageList {
    if (images == null || images!.isEmpty) return [];
    return images!.split(',');
  }

  Review copyWith({
    int? id,
    int? productId,
    int? customerId,
    int? staffId,
    int? orderDetailId,
    int? orderId,
    int? rating,
    String? comment,
    String? images,
    String? shopReply,
    DateTime? reviewDate,
    String? customerName,
    String? customerImage,
    String? productName,
    String? productImage,
    String? variantSize,
    String? variantColor,
    String? variantImage,
  }) {
    return Review(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      customerId: customerId ?? this.customerId,
      staffId: staffId ?? this.staffId,
      orderDetailId: orderDetailId ?? this.orderDetailId,
      orderId: orderId ?? this.orderId,
      rating: rating ?? this.rating,
      comment: comment ?? this.comment,
      images: images ?? this.images,
      shopReply: shopReply ?? this.shopReply,
      reviewDate: reviewDate ?? this.reviewDate,
      customerName: customerName ?? this.customerName,
      customerImage: customerImage ?? this.customerImage,
      productName: productName ?? this.productName,
      productImage: productImage ?? this.productImage,
      variantSize: variantSize ?? this.variantSize,
      variantColor: variantColor ?? this.variantColor,
      variantImage: variantImage ?? this.variantImage,
    );
  }
}
