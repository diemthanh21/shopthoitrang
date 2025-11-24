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
  final String messageType; // 'text' | 'product' | 'media'
  final Map<String, dynamic>? productSnapshot; // when product card
  final String? mediaUrl;
  final String? mediaMimeType;
  final String? mediaName;
  final int? mediaSize;

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
    this.mediaUrl,
    this.mediaMimeType,
    this.mediaName,
    this.mediaSize,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    String type = (json['message_type'] ?? '').toString();
    Map<String, dynamic>? snapshot;
    if (json['product_snapshot'] is Map) {
      snapshot = Map<String, dynamic>.from(json['product_snapshot']);
    }

    Map<String, dynamic>? parsedPayload;
    final rawContent = json['noidung'];
    String contentString = '';
    if (rawContent is Map<String, dynamic>) {
      parsedPayload = Map<String, dynamic>.from(rawContent);
      contentString = jsonEncode(rawContent);
    } else if (rawContent is String) {
      contentString = rawContent;
      final trimmed = rawContent.trim();
      if (trimmed.startsWith('{')) {
        try {
          final decoded = _tryDecode(trimmed);
          if (decoded is Map<String, dynamic>) {
            parsedPayload = decoded;
          }
        } catch (_) {}
      }
    } else if (rawContent != null) {
      contentString = rawContent.toString();
    }

    if (parsedPayload != null) {
      final payloadType = parsedPayload['type']?.toString();
      if (payloadType == 'product' && parsedPayload['product'] is Map) {
        snapshot = Map<String, dynamic>.from(parsedPayload['product'] as Map);
        type = 'product';
      } else if (payloadType == 'media') {
        type = 'media';
      } else if (type.isEmpty && payloadType is String && payloadType.isNotEmpty) {
        type = payloadType;
      }
    }
    if (type.isEmpty) type = 'text';

    Map<String, dynamic>? mediaSnapshot;
    if (type == 'media' && parsedPayload != null) {
      mediaSnapshot = parsedPayload;
    }

    return ChatMessage(
      id: json['machat'] ?? json['id'] ?? 0,
      chatBoxId: json['machatbox'] ?? 0,
      sender: json['nguoigui'] ?? 'KH',
      content: contentString,
      time: json['thoigiangui'] != null
          ? DateTime.tryParse(json['thoigiangui']) ?? DateTime.now()
          : DateTime.now(),
      read: json['daxem'] == true,
      staff: json['nhanvien'],
      messageType: type,
      productSnapshot: snapshot,
      mediaUrl: mediaSnapshot?['url']?.toString(),
      mediaMimeType: mediaSnapshot?['mediaType']?.toString() ??
          mediaSnapshot?['mimeType']?.toString(),
      mediaName: mediaSnapshot?['name']?.toString(),
      mediaSize: () {
        final rawSize = mediaSnapshot?['size'];
        if (rawSize is num) return rawSize.toInt();
        if (rawSize != null) return int.tryParse(rawSize.toString());
        return null;
      }(),
    );
  }
}

dynamic _tryDecode(String s) {
  // lightweight JSON decode without importing dart:convert (we can import if needed).
  // Actually we should import dart:convert at top; but keep helper separate for patch minimalism.
  // We'll add the import.
  return jsonDecode(s);
}
