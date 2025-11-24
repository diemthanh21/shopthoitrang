class ShippingConfig {
  final String? warehouseProvince;
  final double inProvinceFee;
  final double outOfProvinceFee;
  final bool isActive;
  final DateTime? updatedAt;

  ShippingConfig({
    required this.warehouseProvince,
    required this.inProvinceFee,
    required this.outOfProvinceFee,
    required this.isActive,
    this.updatedAt,
  });

  factory ShippingConfig.fromJson(Map<String, dynamic> json) {
    return ShippingConfig(
      warehouseProvince: json['tinh_kho'] ?? json['warehouseProvince'],
      inProvinceFee: _toDouble(json['phi_trong_tinh'] ?? json['inProvinceFee']),
      outOfProvinceFee:
          _toDouble(json['phi_ngoai_tinh'] ?? json['outProvinceFee']),
      isActive: _toBool(json['dang_ap_dung'] ?? json['isActive'] ?? true),
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString())
          : null,
    );
  }

  double feeForProvince(String? province) {
    if (!isActive) return 0;
    final normalizedWarehouse = _normalizeProvince(warehouseProvince);
    final normalizedProvince = _normalizeProvince(province);
    if (normalizedWarehouse.isEmpty) {
      return outOfProvinceFee;
    }
    if (normalizedProvince.isEmpty) {
      return outOfProvinceFee;
    }
    if (normalizedWarehouse == normalizedProvince) {
      return inProvinceFee;
    }
    return outOfProvinceFee;
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }

  static bool _toBool(dynamic value) {
    if (value is bool) return value;
    if (value is num) return value != 0;
    if (value is String) {
      final normalized = value.trim().toLowerCase();
      if (['0', 'false', 'off', 'no'].contains(normalized)) {
        return false;
      }
      if (['1', 'true', 'on', 'yes'].contains(normalized)) {
        return true;
      }
    }
    return value != null;
  }

  static String _normalizeProvince(String? value) {
    if (value == null) return '';
    final lower = value.toLowerCase().trim();
    final buffer = StringBuffer();
    for (final rune in lower.runes) {
      final char = String.fromCharCode(rune);
      buffer.write(_accentMap[char] ?? char);
    }
    return buffer.toString().replaceAll(RegExp(r'[^a-z0-9]'), '');
  }
}

const Map<String, String> _accentMap = {
  'à': 'a',
  'á': 'a',
  'ả': 'a',
  'ã': 'a',
  'ạ': 'a',
  'â': 'a',
  'ầ': 'a',
  'ấ': 'a',
  'ẩ': 'a',
  'ẫ': 'a',
  'ậ': 'a',
  'ă': 'a',
  'ằ': 'a',
  'ắ': 'a',
  'ẳ': 'a',
  'ẵ': 'a',
  'ặ': 'a',
  'è': 'e',
  'é': 'e',
  'ẻ': 'e',
  'ẽ': 'e',
  'ẹ': 'e',
  'ê': 'e',
  'ề': 'e',
  'ế': 'e',
  'ể': 'e',
  'ễ': 'e',
  'ệ': 'e',
  'ì': 'i',
  'í': 'i',
  'ỉ': 'i',
  'ĩ': 'i',
  'ị': 'i',
  'ò': 'o',
  'ó': 'o',
  'ỏ': 'o',
  'õ': 'o',
  'ọ': 'o',
  'ô': 'o',
  'ồ': 'o',
  'ố': 'o',
  'ổ': 'o',
  'ỗ': 'o',
  'ộ': 'o',
  'ơ': 'o',
  'ờ': 'o',
  'ớ': 'o',
  'ở': 'o',
  'ỡ': 'o',
  'ợ': 'o',
  'ù': 'u',
  'ú': 'u',
  'ủ': 'u',
  'ũ': 'u',
  'ụ': 'u',
  'ư': 'u',
  'ừ': 'u',
  'ứ': 'u',
  'ử': 'u',
  'ữ': 'u',
  'ự': 'u',
  'ỳ': 'y',
  'ý': 'y',
  'ỷ': 'y',
  'ỹ': 'y',
  'ỵ': 'y',
  'đ': 'd',
};
