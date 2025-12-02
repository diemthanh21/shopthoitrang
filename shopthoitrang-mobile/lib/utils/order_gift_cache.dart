import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class OrderGiftCacheEntry {
  final int orderId;
  final int parentVariantId;
  final String giftName;
  final String? variantLabel;
  final String? imageUrl;
  final int quantity;

  OrderGiftCacheEntry({
    required this.orderId,
    required this.parentVariantId,
    required this.giftName,
    this.variantLabel,
    this.imageUrl,
    required this.quantity,
  });

  Map<String, dynamic> toJson() => {
        'orderId': orderId,
        'parentVariantId': parentVariantId,
        'giftName': giftName,
        'variantLabel': variantLabel,
        'imageUrl': imageUrl,
        'quantity': quantity,
      };

  factory OrderGiftCacheEntry.fromJson(Map<String, dynamic> json) {
    return OrderGiftCacheEntry(
      orderId: json['orderId'] is int
          ? json['orderId']
          : int.tryParse(json['orderId']?.toString() ?? '0') ?? 0,
      parentVariantId: json['parentVariantId'] is int
          ? json['parentVariantId']
          : int.tryParse(json['parentVariantId']?.toString() ?? '0') ?? 0,
      giftName: json['giftName']?.toString() ?? 'Quà tặng',
      variantLabel: json['variantLabel']?.toString(),
      imageUrl: json['imageUrl']?.toString(),
      quantity: json['quantity'] is int
          ? json['quantity']
          : int.tryParse(json['quantity']?.toString() ?? '0') ?? 0,
    );
  }
}

class OrderGiftCache {
  static const _prefsKey = 'order_gift_cache_v1';

  static Future<void> save(
      int orderId, List<OrderGiftCacheEntry> entries) async {
    if (entries.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    Map<String, dynamic> store = {};
    final raw = prefs.getString(_prefsKey);
    if (raw != null && raw.isNotEmpty) {
      try {
        store = jsonDecode(raw) as Map<String, dynamic>;
      } catch (_) {
        store = {};
      }
    }
    store['$orderId'] = entries.map((e) => e.toJson()).toList();
    await prefs.setString(_prefsKey, jsonEncode(store));
  }

  static Future<List<OrderGiftCacheEntry>> get(int orderId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final list = map['$orderId'];
      if (list is List) {
        return list
            .map((item) => OrderGiftCacheEntry.fromJson(
                Map<String, dynamic>.from(item as Map)))
            .toList();
      }
    } catch (_) {
      return [];
    }
    return [];
  }

  static Future<void> remove(int orderId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsKey);
    if (raw == null || raw.isEmpty) return;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      if (map.remove('$orderId') != null) {
        await prefs.setString(_prefsKey, jsonEncode(map));
      }
    } catch (_) {
      await prefs.remove(_prefsKey);
    }
  }
}
