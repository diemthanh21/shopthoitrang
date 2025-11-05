class CartImage {
  final int id;
  final String url;
  final int order;

  CartImage({
    required this.id,
    required this.url,
    required this.order,
  });

  factory CartImage.fromJson(Map<String, dynamic> json) {
    return CartImage(
      id: json['id'] ?? 0,
      url: json['url'] ?? '',
      order: json['order'] ?? 0,
    );
  }
}

class CartItem {
  final int id;
  final int variantId;
  final int quantity;
  final double price;
  final CartVariant? variant;

  CartItem({
    required this.id,
    required this.variantId,
    required this.quantity,
    required this.price,
    this.variant,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id'] ?? 0,
      variantId: json['variantId'] ?? 0,
      quantity: json['quantity'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
      variant: json['variant'] != null
          ? CartVariant.fromJson(json['variant'])
          : null,
    );
  }

  double get total => price * quantity;

  String get displayName {
    if (variant?.product?.name != null) {
      return variant!.product!.name;
    }
    return 'Sản phẩm #$variantId';
  }

  String get displayVariant {
    if (variant == null) return '';
    final parts = <String>[];
    if (variant!.color != null && variant!.color!.isNotEmpty) {
      parts.add(variant!.color!);
    }
    if (variant!.size != null && variant!.size!.isNotEmpty) {
      parts.add(variant!.size!);
    }
    return parts.join(' - ');
  }

  String? get imageUrl {
    if (variant?.images != null && variant!.images.isNotEmpty) {
      return variant!.images.first.url;
    }
    return null;
  }
}

class CartVariant {
  final int id;
  final int productId;
  final String? size;
  final String? color;
  final double price;
  final int stock;
  final List<CartImage> images;
  final CartProduct? product;

  CartVariant({
    required this.id,
    required this.productId,
    this.size,
    this.color,
    required this.price,
    required this.stock,
    this.images = const [],
    this.product,
  });

  factory CartVariant.fromJson(Map<String, dynamic> json) {
    return CartVariant(
      id: json['id'] ?? 0,
      productId: json['productId'] ?? 0,
      size: json['size'],
      color: json['color'],
      price: (json['price'] ?? 0).toDouble(),
      stock: json['stock'] ?? 0,
      images: (json['images'] as List<dynamic>?)
              ?.map((img) => CartImage.fromJson(img))
              .toList() ??
          [],
      product: json['product'] != null
          ? CartProduct.fromJson(json['product'])
          : null,
    );
  }
}

class CartProduct {
  final int id;
  final String name;

  CartProduct({
    required this.id,
    required this.name,
  });

  factory CartProduct.fromJson(Map<String, dynamic> json) {
    return CartProduct(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
    );
  }
}

class Cart {
  final int cartId;
  final List<CartItem> items;
  final double total;
  final int itemCount;

  Cart({
    required this.cartId,
    required this.items,
    required this.total,
    required this.itemCount,
  });

  factory Cart.fromJson(Map<String, dynamic> json) {
    print('[Cart.fromJson] Raw JSON: $json');
    final items = (json['items'] as List<dynamic>?)
            ?.map((item) => CartItem.fromJson(item))
            .toList() ??
        [];
    print('[Cart.fromJson] Parsed ${items.length} items');
    return Cart(
      cartId: json['cartId'] ?? 0,
      items: items,
      total: (json['total'] ?? 0).toDouble(),
      itemCount: json['itemCount'] ?? 0,
    );
  }

  factory Cart.empty() {
    return Cart(
      cartId: 0,
      items: [],
      total: 0,
      itemCount: 0,
    );
  }

  bool get isEmpty => items.isEmpty;
  bool get isNotEmpty => items.isNotEmpty;
}
