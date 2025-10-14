class Product {
  final dynamic id; // masanpham
  final String name; // tensanpham
  final num price; // giaban
  final String? imageUrl;

  Product({required this.id, required this.name, required this.price, this.imageUrl});

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['masanpham'] ?? json['id'],
        name: json['tensanpham'] ?? json['name'] ?? 'Sản phẩm',
        price: json['giaban'] ?? json['price'] ?? 0,
        imageUrl: (json['hinhanh'] ?? json['image'])?.toString(),
      );
}
