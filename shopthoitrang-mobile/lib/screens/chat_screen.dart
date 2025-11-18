import 'package:flutter/material.dart';
import 'dart:convert';
import '../models/chat_models.dart';
import '../models/product_model.dart';
import '../services/chat_service.dart';

class ChatScreen extends StatefulWidget {
  final ChatBox chatBox;
  final Product? product; // sản phẩm đang xem khi mở chat (tùy chọn)
  const ChatScreen({super.key, required this.chatBox, this.product});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _svc = ChatService();
  final _scrollCtrl = ScrollController();
  final _textCtrl = TextEditingController();
  bool _loading = true;
  List<ChatMessage> _messages = [];
  bool _sentProductCard = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await _svc.getMessages(widget.chatBox.id);
      setState(() => _messages = list);
      // Mark all as read when opening
      try {
        await _svc.markAllRead(widget.chatBox.id);
        if (mounted) {
          setState(() => _messages = _messages
              .map((m) => ChatMessage(
                    id: m.id,
                    chatBoxId: m.chatBoxId,
                    sender: m.sender,
                    content: m.content,
                    time: m.time,
                    read: true,
                    staff: m.staff,
                    messageType: m.messageType,
                    productSnapshot: m.productSnapshot,
                  ))
              .toList());
        }
      } catch (e) {
        debugPrint('markAllRead failed: $e');
      }
      _jumpToBottom();
      // If opened from a product context, send a product snapshot once
      if (widget.product != null && !_sentProductCard) {
        await _sendProductCard();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không tải được tin nhắn: $e')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _textCtrl.text.trim();
    if (text.isEmpty) return;
    try {
      final msg = await _svc.sendMessage(widget.chatBox.id, text);
      setState(() {
        _messages.add(msg);
        _textCtrl.clear();
      });
      _jumpToBottom();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gửi thất bại: $e')),
      );
    }
  }

  void _jumpToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent + 60,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendProductCard() async {
    final p = widget.product;
    if (p == null) return;
    try {
      final img = (p.variants.isNotEmpty && p.variants.first.images.isNotEmpty)
          ? p.variants.first.images.first.url
          : '';
      final price =
          p.minPrice ?? (p.variants.isNotEmpty ? p.variants.first.price : null);
      final msg = await _svc.sendProductMessage(
        chatBoxId: widget.chatBox.id,
        productId: p.id,
        productName: p.name,
        imageUrl: img,
        price: price,
      );
      setState(() {
        _messages.add(msg);
        _sentProductCard = true;
      });
      _jumpToBottom();
    } catch (e) {
      // best-effort only; don't block chat if this fails
      debugPrint('Failed to send product card: $e');
    }
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    _textCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Chat với cửa hàng #${widget.chatBox.id}'),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.all(12),
                    itemCount: _messages.length,
                    itemBuilder: (_, i) {
                      final m = _messages[i];
                      final isCustomer = m.sender == 'KH';
                      final isProduct = m.messageType == 'product' &&
                          m.productSnapshot != null;
                      return Align(
                        alignment: isCustomer
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          constraints: const BoxConstraints(maxWidth: 320),
                          decoration: BoxDecoration(
                            color: isCustomer ? Colors.blue : Colors.white,
                            border: Border.all(
                                color: isCustomer
                                    ? Colors.transparent
                                    : Colors.grey.shade200),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!isCustomer && m.staff != null)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 2),
                                  child: Text(
                                    m.staff!['tendangnhap']?.toString() ??
                                        'Nhân viên',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ),
                              if (isProduct)
                                _buildProductBubble(m, isCustomer)
                              else ...[
                                // Fallback rendering: if content is a product JSON string, parse and render
                                if (_looksLikeProductJson(m.content))
                                  _buildProductBubble(
                                      _fromContent(m), isCustomer)
                                else
                                  Text(
                                    m.content,
                                    style: TextStyle(
                                        color: isCustomer
                                            ? Colors.white
                                            : Colors.black87),
                                  ),
                              ],
                              const SizedBox(height: 2),
                              Text(
                                [
                                  _format(m.time),
                                  if (m.read) '✓',
                                ].join(' '),
                                style: TextStyle(
                                  fontSize: 10,
                                  color:
                                      isCustomer ? Colors.white70 : Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 6, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textCtrl,
                      decoration: const InputDecoration(
                        hintText: 'Nhập tin nhắn...',
                        isDense: true,
                        border: OutlineInputBorder(),
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _send,
                    child: const Text('Gửi'),
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  String _format(DateTime t) {
    return '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')} ${t.day}/${t.month}/${t.year}';
  }

  Widget _buildProductBubble(ChatMessage m, bool isCustomer) {
    final snap = m.productSnapshot ?? {};
    final name = snap['tensanpham']?.toString() ?? 'Sản phẩm';
    final img = snap['hinhanh']?.toString();
    final price = snap['giaban'];
    final color = snap['mausac'];
    final size = snap['kichco'];
    return Container(
      width: 260,
      decoration: BoxDecoration(
        color: isCustomer ? Colors.white.withOpacity(0.15) : Colors.grey[50],
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.all(8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: img != null && img.isNotEmpty
                ? Image.network(
                    img,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 60,
                      height: 60,
                      color: Colors.grey[300],
                      child: const Icon(Icons.broken_image, size: 20),
                    ),
                  )
                : Container(
                    width: 60,
                    height: 60,
                    color: Colors.grey[200],
                    child: const Icon(Icons.image_not_supported, size: 20),
                  ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isCustomer ? Colors.white : Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                if (price != null)
                  Text(
                    '${(price is num ? price : num.tryParse(price.toString()) ?? 0).toStringAsFixed(0)}đ',
                    style: TextStyle(
                      fontSize: 12,
                      color: isCustomer ? Colors.white70 : Colors.red,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                if (color != null || size != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      [
                        if (color != null) 'Màu: $color',
                        if (size != null) 'Size: $size'
                      ].join(' • '),
                      style: TextStyle(
                        fontSize: 11,
                        color: isCustomer ? Colors.white70 : Colors.grey[700],
                      ),
                    ),
                  ),
              ],
            ),
          )
        ],
      ),
    );
  }

  bool _looksLikeProductJson(String content) {
    final s = content.trim();
    return s.startsWith('{') && s.contains('"type"') && s.contains('"product"');
  }

  ChatMessage _fromContent(ChatMessage source) {
    try {
      final decoded = jsonDecode(source.content);
      if (decoded is Map &&
          decoded['type'] == 'product' &&
          decoded['product'] is Map) {
        return ChatMessage(
          id: source.id,
          chatBoxId: source.chatBoxId,
          sender: source.sender,
          content: source.content,
          time: source.time,
          read: source.read,
          staff: source.staff,
          messageType: 'product',
          productSnapshot: Map<String, dynamic>.from(decoded['product'] as Map),
        );
      }
    } catch (_) {}
    return source;
  }
}
