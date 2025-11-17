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

/// ThÃ´ng tin sáº£n pháº©m quÃ  táº·ng (mua X táº·ng Y)
class CartGiftProduct {
  final int id;
  final String name;
  final String? variantLabel; // vÃ­ dá»¥: "Äá» - M"
  final String? imageUrl;

  CartGiftProduct({
    required this.id,
    required this.name,
    this.variantLabel,
    this.imageUrl,
  });

  factory CartGiftProduct.fromJson(Map<String, dynamic> json) {
    return CartGiftProduct(
      // TODO: map Ä‘Ãºng vá»›i key tá»« API / database cá»§a báº¡n
      id: json['id'] ??
          json['productId'] ??
          json['sanpham_id'] ??
          json['giftProductId'] ??
          0,
      name: json['name'] ??
          json['ten'] ??
          json['productName'] ??
          json['giftProductName'] ??
          '',
      variantLabel: json['variant'] ??
          json['phan_loai'] ??
          json['variantLabel'] ??
          json['giftVariantLabel'],
      imageUrl: json['image'] ??
          json['imageUrl'] ??
          json['anh'] ??
          json['giftImageUrl'],
    );
  }
}

class CartGiftOption {
  final int variantId;
  final int? productId;
  final int? sizeBridgeId;
  final String name;
  final String? label;
  final String? sizeLabel;
  final String? color;
  final String? imageUrl;
  final String? promoLabel;
  final int buyQty;
  final int giftQty;
  final int eligibleQuantity;

  CartGiftOption({
    required this.variantId,
    required this.name,
    this.productId,
    this.sizeBridgeId,
    this.label,
    this.sizeLabel,
    this.color,
    this.imageUrl,
    this.promoLabel,
    this.buyQty = 1,
    this.giftQty = 1,
    this.eligibleQuantity = 0,
  });

  factory CartGiftOption.fromJson(Map<String, dynamic> json) {
    int? parseInt(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toInt();
      return int.tryParse(value.toString());
    }

    return CartGiftOption(
      variantId:
          parseInt(json['variantId'] ?? json['variant_id'] ?? json['id']) ?? 0,
      productId: parseInt(json['productId'] ?? json['product_id']),
      sizeBridgeId:
          parseInt(json['sizeBridgeId'] ?? json['size_bridge_id'] ?? json['sizeId']),
      name: (json['productName'] ?? json['name'] ?? '').toString(),
      label: json['label']?.toString(),
      sizeLabel: json['sizeLabel']?.toString(),
      color: json['color']?.toString(),
      imageUrl: json['imageUrl']?.toString(),
      promoLabel: json['promoLabel']?.toString(),
      buyQty: parseInt(json['buyQty'] ?? json['buy_qty']) ?? 1,
      giftQty: parseInt(json['giftQty'] ?? json['gift_qty']) ?? 1,
      eligibleQuantity:
          parseInt(json['eligibleQuantity'] ?? json['eligible_quantity']) ?? 0,
    );
  }
}


class CartItem {
  final int id;
  final int variantId;
  final int quantity;

  /// GiÃ¡ Ä‘ang tÃ­nh tiá»n cho item (sau khi Ã¡p dá»¥ng khuyáº¿n mÃ£i náº¿u backend Ä‘Ã£ tÃ­nh)
  final double price;

  final int? sizeBridgeId; // id chitietsanpham_kichthuoc
  final CartVariant? variant;

  // ====== THÃ”NG TIN KHUYáº¾N MÃƒI ======

  /// GiÃ¡ gá»‘c trÆ°á»›c khuyáº¿n mÃ£i (náº¿u cÃ³). Náº¿u null thÃ¬ sáº½ fallback qua variant.price.
  final double? originalPrice;

  /// Pháº§n trÄƒm giáº£m (10 -> 10%)
  final double? discountPercent;

  /// Loáº¡i khuyáº¿n mÃ£i (vd: 'PERCENT', 'BUY_X_GET_Y')
  final String? promotionType;

  /// TÃªn / nhÃ£n chÆ°Æ¡ng trÃ¬nh khuyáº¿n mÃ£i (vd: 'Giáº£m 10% má»—i sáº£n pháº©m')
  final String? promotionLabel;

  /// ThÃ´ng tin quÃ  táº·ng (náº¿u lÃ  khuyáº¿n mÃ£i mua X táº·ng Y)
  final CartGiftProduct? giftProduct;
  final List<CartGiftOption> giftOptions;
  final int giftRewardQuantity;
  final int? selectedGiftVariantId;
  final int? selectedGiftSizeBridgeId;
  static const Map<String, String> _vietnameseDiacritics = {
    'Ã ': 'a',
    'Ã¡': 'a',
    'áº£': 'a',
    'Ã£': 'a',
    'áº¡': 'a',
    'Ã¢': 'a',
    'áº§': 'a',
    'áº¥': 'a',
    'áº©': 'a',
    'áº«': 'a',
    'áº­': 'a',
    'Äƒ': 'a',
    'áº±': 'a',
    'áº¯': 'a',
    'áº³': 'a',
    'áºµ': 'a',
    'áº·': 'a',
    'Ã¨': 'e',
    'Ã©': 'e',
    'áº»': 'e',
    'áº½': 'e',
    'áº¹': 'e',
    'Ãª': 'e',
    'á»': 'e',
    'áº¿': 'e',
    'á»ƒ': 'e',
    'á»…': 'e',
    'á»‡': 'e',
    'Ã¬': 'i',
    'Ã­': 'i',
    'á»‰': 'i',
    'Ä©': 'i',
    'á»‹': 'i',
    'Ã²': 'o',
    'Ã³': 'o',
    'á»': 'o',
    'Ãµ': 'o',
    'á»': 'o',
    'Ã´': 'o',
    'á»“': 'o',
    'á»‘': 'o',
    'á»•': 'o',
    'á»—': 'o',
    'á»™': 'o',
    'Æ¡': 'o',
    'á»': 'o',
    'á»›': 'o',
    'á»Ÿ': 'o',
    'á»¡': 'o',
    'á»£': 'o',
    'Ã¹': 'u',
    'Ãº': 'u',
    'á»§': 'u',
    'Å©': 'u',
    'á»¥': 'u',
    'Æ°': 'u',
    'á»«': 'u',
    'á»©': 'u',
    'á»­': 'u',
    'á»¯': 'u',
    'á»±': 'u',
    'á»³': 'y',
    'Ã½': 'y',
    'á»·': 'y',
    'á»¹': 'y',
    'á»µ': 'y',
    'Ä‘': 'd',
  };

  CartItem({
    required this.id,
    required this.variantId,
    required this.quantity,
    required this.price,
    this.sizeBridgeId,
    this.variant,
    this.originalPrice,
    this.discountPercent,
    this.promotionType,
    this.promotionLabel,
    this.giftProduct,
    this.giftOptions = const [],
    this.giftRewardQuantity = 0,
    this.selectedGiftVariantId,
    this.selectedGiftSizeBridgeId,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    // Map giÃ¡ gá»‘c & % giáº£m tá»« nhiá»u kiá»ƒu key khÃ¡c nhau (tÃ¹y backend)
    final originalPriceRaw = json['originalPrice'] ??
        json['giaGoc'] ??
        json['gia_goc'] ??
        json['basePrice'];

    final discountPercentRaw = json['discountPercent'] ??
        json['discount_percent'] ??
        json['tyLeGiam'] ??
        json['ty_le_giam'] ??
        json['promotionPercent'];

    final promotionType = json['promotionType'] ??
        json['promotion_type'] ??
        json['loaiKhuyenMai'] ??
        json['loai_khuyen_mai'];

    final promotionLabel = json['promotionLabel'] ??
        json['promotion_label'] ??
        json['tenChuongTrinh'] ??
        json['ten_khuyen_mai'];

    // QuÃ  táº·ng: náº¿u API tráº£ nested object
    final dynamic giftJson =
        json['giftProduct'] ?? json['gift_product'] ?? json['qua_tang'];

    final List<CartGiftOption> parsedGiftOptions;
    final dynamic rawOptions =
        json['giftOptions'] ?? json['gift_options'] ?? json['qua_tang_ds'];
    if (rawOptions is List) {
      parsedGiftOptions = rawOptions
          .whereType<Map<String, dynamic>>()
          .map(CartGiftOption.fromJson)
          .toList();
    } else {
      parsedGiftOptions = const [];
    }

    int? parseOptionalInt(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toInt();
      return int.tryParse(value.toString());
    }

    return CartItem(
      id: json['id'] ?? 0,
      variantId: json['variantId'] ?? json['variant_id'] ?? 0,
      quantity: json['quantity'] ?? 0,
      price: (json['price'] ?? json['finalPrice'] ?? json['giaSauGiam'] ?? 0)
          .toDouble(),
      sizeBridgeId: json['sizeBridgeId'] ??
          json['chitietsize_id'] ??
          json['chitietsizeId'],
      variant: json['variant'] != null
          ? CartVariant.fromJson(json['variant'])
          : null,
      originalPrice:
          originalPriceRaw != null ? (originalPriceRaw as num).toDouble() : null,
      discountPercent: discountPercentRaw != null
          ? (discountPercentRaw as num).toDouble()
          : null,
      promotionType: promotionType,
      promotionLabel: promotionLabel,
      giftProduct: giftJson != null
          ? CartGiftProduct.fromJson(giftJson as Map<String, dynamic>)
          : null,
      giftOptions: parsedGiftOptions,
      giftRewardQuantity: parseOptionalInt(
            json['giftRewardQuantity'] ?? json['gift_reward_quantity']) ??
          0,
      selectedGiftVariantId: parseOptionalInt(
        json['selectedGiftVariantId'] ??
            json['giftVariantId'] ??
            json['gift_variant_id'],
      ),
      selectedGiftSizeBridgeId: parseOptionalInt(
        json['selectedGiftSizeBridgeId'] ??
            json['giftSizeBridgeId'] ??
            json['gift_size_bridge_id'],
      ),
    );
  }

  String _normalizePromotionText(String? value) {
    if (value == null) return '';
    var result = value.toLowerCase();
    _vietnameseDiacritics.forEach((key, replacement) {
      result = result.replaceAll(key, replacement);
    });
    return result;
  }

  bool get _looksLikeBuyXGetYPromotion {
    final rawType = promotionType ?? '';
    var normalizedType = _normalizePromotionText(rawType);
    normalizedType =
        normalizedType.replaceAll(RegExp(r'[\s_\-]+'), '').trim();
    const typeKeywords = {
      'buyxgety',
      'buy1get1',
      'buyonegetone',
      'b1g1',
      'bogo',
      'mua1tang1',
      'mua1+1',
      'mua1plus1',
    };
    if (typeKeywords.contains(normalizedType)) {
      return true;
    }
    if ((normalizedType.contains('buy') && normalizedType.contains('get')) ||
        (normalizedType.contains('mua') &&
            normalizedType.contains('tang'))) {
      return true;
    }

    final normalizedLabel =
        _normalizePromotionText(promotionLabel).replaceAll(RegExp(r'\s+'), ' ');
    if (normalizedLabel.isEmpty) return false;
    const labelKeywords = [
      'mua 1 tang 1',
      'mua 1 + 1',
      'mua 1+1',
      'mua mot tang mot',
      'buy 1 get 1',
      'buy one get one',
      'b1g1',
    ];
    for (final keyword in labelKeywords) {
      if (normalizedLabel.contains(keyword)) {
        return true;
      }
    }
    return false;
  }

  CartGiftProduct? get _syntheticGiftProduct {
    if (!_looksLikeBuyXGetYPromotion) return null;
    final variantData = variant;
    if (variantData == null) return null;

    final variantLabel =
        displayVariant.isNotEmpty ? displayVariant : null;
    final img = imageUrl ??
        (variantData.images.isNotEmpty
            ? variantData.images.first.url
            : null);

    return CartGiftProduct(
      id: variantData.id,
      name: displayName,
      variantLabel: variantLabel,
      imageUrl: img,
    );
  }
  CartGiftProduct? get _selectedGiftProduct {
    if (giftOptions.isEmpty || selectedGiftVariantId == null) return null;
    CartGiftOption? match;
    for (final option in giftOptions) {
      final sameVariant = option.variantId == selectedGiftVariantId;
      if (!sameVariant) continue;
      final optionSize = option.sizeBridgeId ?? -1;
      final selectedSize = selectedGiftSizeBridgeId ?? optionSize;
      if (optionSize == selectedSize) {
        match = option;
        break;
      }
      match ??= option;
    }
    if (match == null) return null;
    final labels = <String>[];
    if (match.color != null && match.color!.isNotEmpty) {
      labels.add(match.color!);
    }
    if (match.sizeLabel != null && match.sizeLabel!.isNotEmpty) {
      labels.add(match.sizeLabel!);
    }
    if (match.label != null && match.label!.isNotEmpty && labels.isEmpty) {
      labels.add(match.label!);
    }
    return CartGiftProduct(
      id: match.variantId,
      name: match.name,
      variantLabel: labels.isNotEmpty ? labels.join(' - ') : null,
      imageUrl: match.imageUrl,
    );
  }


  CartGiftProduct? get resolvedGiftProduct =>
      giftProduct ?? _syntheticGiftProduct;

  double get total => price * quantity;

  /// TÃªn sáº£n pháº©m Ä‘á»ƒ hiá»ƒn thá»‹
  String get displayName {
    if (variant?.product?.name != null &&
        variant!.product!.name.trim().isNotEmpty) {
      return variant!.product!.name;
    }
    return 'Sáº£n pháº©m #$variantId';
  }

  /// Text mÃ u-size
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

  /// GiÃ¡ gá»‘c Ä‘á»ƒ hiá»ƒn thá»‹ (náº¿u khÃ´ng cÃ³ originalPrice thÃ¬ láº¥y variant.price)
  double get displayOriginalPrice =>
      (originalPrice ?? variant?.price ?? price).toDouble();

  /// GiÃ¡ sau khi tÃ­nh khuyáº¿n mÃ£i (line price)
  double get displayFinalPrice => price;

  /// CÃ³ giáº£m theo % khÃ´ng
  bool get hasPercentDiscount =>
      discountPercent != null &&
      discountPercent! > 0 &&
      displayOriginalPrice > displayFinalPrice;

  String? get discountPercentText =>
      hasPercentDiscount ? '${discountPercent!.toStringAsFixed(0)}%' : null;

  /// CÃ³ khuyáº¿n mÃ£i táº·ng quÃ  khÃ´ng
  bool get hasGiftPromotion => resolvedGiftProduct != null;
  bool get hasGiftOptions => giftOptions.isNotEmpty;

  bool get isBuyXGetYPromotion => _looksLikeBuyXGetYPromotion;

  String? get giftProductName => resolvedGiftProduct?.name;

  String? get giftVariantLabel => resolvedGiftProduct?.variantLabel;
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
      productId: json['productId'] ?? json['product_id'] ?? 0,
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
      cartId: json['cartId'] ?? json['id'] ?? 0,
      items: items,
      total: (json['total'] ?? 0).toDouble(),
      itemCount: json['itemCount'] ?? json['item_count'] ?? items.length,
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
