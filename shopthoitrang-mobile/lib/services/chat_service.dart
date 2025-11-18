import 'package:shopthoitrang_mobile/services/api_client.dart';
import '../models/chat_models.dart';

class ChatService {
  final ApiClient _api = ApiClient();

  Future<ChatBox> startChat() async {
    final res = await _api.post('/chat/start', {});
    final data = res['data'] ?? res;
    return ChatBox.fromJson(data);
  }

  Future<List<ChatMessage>> getMessages(int chatBoxId) async {
    final res = await _api.get('/chat/messages/$chatBoxId');
    final data = res['data'] ?? res;
    final list = (data is List) ? data : (data['data'] as List? ?? []);
    return list
        .map((e) => ChatMessage.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<ChatMessage> sendMessage(int chatBoxId, String content) async {
    final res = await _api.post('/chat/send', {
      'machatbox': chatBoxId,
      'noidung': content,
    });
    final data = res['data'] ?? res;
    return ChatMessage.fromJson(Map<String, dynamic>.from(data));
  }

  Future<ChatMessage> sendProductMessage({
    required int chatBoxId,
    required int productId,
    required String productName,
    String? imageUrl,
    double? price,
    String? size,
    String? color,
    int? quantity,
  }) async {
    final res = await _api.post('/chat/send-product', {
      'machatbox': chatBoxId,
      'masanpham': productId,
      'tensanpham': productName,
      if (imageUrl != null && imageUrl.isNotEmpty) 'hinhanh': imageUrl,
      if (price != null) 'giaban': price,
      if (size != null && size.isNotEmpty) 'kichco': size,
      if (color != null && color.isNotEmpty) 'mausac': color,
      if (quantity != null) 'soluong': quantity,
    });
    final data = res['data'] ?? res;
    return ChatMessage.fromJson(Map<String, dynamic>.from(data));
  }

  Future<void> markRead(int messageId) async {
    await _api.put('/chat/read/$messageId', {});
  }

  Future<void> markAllRead(int chatBoxId) async {
    await _api.put('/chat/read-all/$chatBoxId', {});
  }
}
