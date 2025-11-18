import 'dart:convert';

class ChatBox {
  final int id;
  final int? customerId;
  final int? staffId;
  final DateTime? createdAt;
  final String? status;

  ChatBox({
    required this.id,
    this.customerId,
    this.staffId,
    this.createdAt,
    this.status,
  });

  factory ChatBox.fromJson(Map<String, dynamic> json) => ChatBox(
        id: json['machatbox'] ?? json['id'] ?? 0,
        customerId: json['makhachhang'],
        staffId: json['manhanvien'],
        createdAt:
            json['ngaytao'] != null ? DateTime.tryParse(json['ngaytao']) : null,
        status: json['trangthai'],
      );
}

class ChatMessage {
  final int id;
  final int chatBoxId;
  final String sender; // 'KH' | 'NV'
  final String content;
  final DateTime time;
  final bool read;
  final Map<String, dynamic>? staff; // { manhanvien, tendangnhap }
  final String messageType; // 'text' | 'product'
  final Map<String, dynamic>? productSnapshot; // when product card

  ChatMessage({
    required this.id,
    required this.chatBoxId,
    required this.sender,
    required this.content,
    required this.time,
    required this.read,
    this.staff,
    required this.messageType,
    this.productSnapshot,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    // Attempt to parse type/product from either explicit columns (message_type, product_snapshot)
    // or from JSON-encoded noidung fallback.
    String type = (json['message_type'] ?? '').toString();
    Map<String, dynamic>? snapshot;
    if (json['product_snapshot'] is Map) {
      snapshot = Map<String, dynamic>.from(json['product_snapshot']);
    }
    // Fallback: parse noidung if it looks like a JSON structure
    if (snapshot == null && (type.isEmpty || type == 'product')) {
      final raw = json['noidung'];
      // Case 1: already an object
      if (raw is Map) {
        if (raw['type'] == 'product' && raw['product'] is Map) {
          type = 'product';
          snapshot = Map<String, dynamic>.from(raw['product'] as Map);
        }
      }
      // Case 2: stringified JSON
      else if (raw is String) {
        final s = raw.trim();
        if (s.startsWith('{')) {
          try {
            final decoded = _tryDecode(s);
            if (decoded is Map &&
                decoded['type'] == 'product' &&
                decoded['product'] is Map) {
              type = 'product';
              snapshot = Map<String, dynamic>.from(decoded['product'] as Map);
            }
          } catch (_) {
            // Last resort: simply mark it as product if signature is present
            if (s.contains('"type"') && s.contains('"product"')) {
              type = 'product';
            }
          }
        }
      }
    }
    if (type.isEmpty) type = 'text';

    return ChatMessage(
      id: json['machat'] ?? json['id'] ?? 0,
      chatBoxId: json['machatbox'] ?? 0,
      sender: json['nguoigui'] ?? 'KH',
      content: json['noidung'] ?? '',
      time: json['thoigiangui'] != null
          ? DateTime.tryParse(json['thoigiangui']) ?? DateTime.now()
          : DateTime.now(),
      read: json['daxem'] == true,
      staff: json['nhanvien'],
      messageType: type,
      productSnapshot: snapshot,
    );
  }
}

dynamic _tryDecode(String s) {
  // lightweight JSON decode without importing dart:convert (we can import if needed).
  // Actually we should import dart:convert at top; but keep helper separate for patch minimalism.
  // We'll add the import.
  return jsonDecode(s);
}
