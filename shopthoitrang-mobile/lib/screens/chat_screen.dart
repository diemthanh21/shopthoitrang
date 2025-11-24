import 'package:flutter/material.dart';
import 'dart:convert';
import '../models/chat_models.dart';
import '../models/product_model.dart';
import '../services/chat_service.dart';

const Color kPrimaryBlue = Color(0xFF0288D1);
const Color kLightBlue = Color(0xFFE1F5FE);
const Color kDarkBlue = Color(0xFF01579B);

class ChatScreen extends StatefulWidget {
  final ChatBox chatBox;
  final Product? product;
  const ChatScreen({super.key, required this.chatBox, this.product});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _svc = ChatService();
  final _scrollCtrl = ScrollController();
  final _textCtrl = TextEditingController();
  final _focusNode = FocusNode();
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
      
      if (widget.product != null && !_sentProductCard) {
        await _sendProductCard();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không tải được tin nhắn: $e'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
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
        SnackBar(
          content: Text('Gửi thất bại: $e'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
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
      debugPrint('Failed to send product card: $e');
    }
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    _textCtrl.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        backgroundColor: kPrimaryBlue,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.store,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Cửa hàng',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    'Đang hoạt động',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            onPressed: () {
              // Show options
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: kPrimaryBlue),
                  )
                : _messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: kLightBlue.withOpacity(0.3),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.chat_bubble_outline,
                                size: 64,
                                color: kPrimaryBlue.withOpacity(0.5),
                              ),
                            ),
                            const SizedBox(height: 24),
                            Text(
                              'Chưa có tin nhắn',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey[700],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Gửi tin nhắn để bắt đầu trò chuyện',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) {
                          final m = _messages[i];
                          final isCustomer = m.sender == 'KH';
                          final isProduct = m.messageType == 'product' &&
                              m.productSnapshot != null;
                          
                          // Show date separator if needed
                          final showDateSeparator = i == 0 ||
                              !_isSameDay(
                                  _messages[i - 1].time, _messages[i].time);

                          return Column(
                            children: [
                              if (showDateSeparator)
                                _buildDateSeparator(m.time),
                              _buildMessageBubble(m, isCustomer, isProduct),
                            ],
                          );
                        },
                      ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildDateSeparator(DateTime date) {
    final today = DateTime.now();
    final isToday = _isSameDay(date, today);
    final isYesterday = _isSameDay(
      date,
      today.subtract(const Duration(days: 1)),
    );

    String label;
    if (isToday) {
      label = 'Hôm nay';
    } else if (isYesterday) {
      label = 'Hôm qua';
    } else {
      label = '${date.day}/${date.month}/${date.year}';
    }

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Divider(color: Colors.grey[300])),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(child: Divider(color: Colors.grey[300])),
        ],
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  Widget _buildMessageBubble(ChatMessage m, bool isCustomer, bool isProduct) {
    return Align(
      alignment: isCustomer ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        child: Row(
          mainAxisAlignment:
              isCustomer ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isCustomer) ...[
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: kLightBlue,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.support_agent,
                  size: 18,
                  color: kPrimaryBlue,
                ),
              ),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 280),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  gradient: isCustomer
                      ? LinearGradient(
                          colors: [kPrimaryBlue, kDarkBlue],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : null,
                  color: isCustomer ? null : Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(isCustomer ? 16 : 4),
                    topRight: Radius.circular(isCustomer ? 4 : 16),
                    bottomLeft: const Radius.circular(16),
                    bottomRight: const Radius.circular(16),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.06),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!isCustomer && m.staff != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          m.staff!['tendangnhap']?.toString() ?? 'Nhân viên',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: kPrimaryBlue,
                          ),
                        ),
                      ),
                    if (isProduct)
                      _buildProductBubble(m, isCustomer)
                    else ...[
                      if (_looksLikeProductJson(m.content))
                        _buildProductBubble(_fromContent(m), isCustomer)
                      else
                        Text(
                          m.content,
                          style: TextStyle(
                            color: isCustomer ? Colors.white : Colors.black87,
                            fontSize: 14,
                            height: 1.4,
                          ),
                        ),
                    ],
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _formatTime(m.time),
                          style: TextStyle(
                            fontSize: 10,
                            color: isCustomer
                                ? Colors.white.withOpacity(0.8)
                                : Colors.grey[600],
                          ),
                        ),
                        if (isCustomer && m.read) ...[
                          const SizedBox(width: 4),
                          Icon(
                            Icons.done_all,
                            size: 14,
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
            if (isCustomer) const SizedBox(width: 8),
          ],
        ),
      ),
    );
  }

  Widget _buildProductBubble(ChatMessage m, bool isCustomer) {
    final snap = m.productSnapshot ?? {};
    final name = snap['tensanpham']?.toString() ?? 'Sản phẩm';
    final img = snap['hinhanh']?.toString();
    final price = snap['giaban'];
    final color = snap['mausac'];
    final size = snap['kichco'];
    
    return Container(
      decoration: BoxDecoration(
        color: isCustomer
            ? Colors.white.withOpacity(0.15)
            : kLightBlue.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCustomer
              ? Colors.white.withOpacity(0.3)
              : kPrimaryBlue.withOpacity(0.2),
        ),
      ),
      padding: const EdgeInsets.all(10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: img != null && img.isNotEmpty
                ? Image.network(
                    img,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.broken_image,
                        size: 24,
                        color: Colors.grey[500],
                      ),
                    ),
                  )
                : Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.image_not_supported,
                      size: 24,
                      color: Colors.grey[500],
                    ),
                  ),
          ),
          const SizedBox(width: 10),
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
                const SizedBox(height: 6),
                if (price != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: isCustomer
                          ? Colors.white.withOpacity(0.2)
                          : Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${(price is num ? price : num.tryParse(price.toString()) ?? 0).toStringAsFixed(0)}₫',
                      style: TextStyle(
                        fontSize: 12,
                        color: isCustomer ? Colors.white : Colors.red,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                if (color != null || size != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      [
                        if (color != null) 'Màu: $color',
                        if (size != null) 'Size: $size'
                      ].join(' • '),
                      style: TextStyle(
                        fontSize: 11,
                        color: isCustomer
                            ? Colors.white.withOpacity(0.9)
                            : Colors.grey[700],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: TextField(
                    controller: _textCtrl,
                    focusNode: _focusNode,
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    decoration: InputDecoration(
                      hintText: 'Nhập tin nhắn...',
                      hintStyle: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[500],
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      prefixIcon: Icon(
                        Icons.sentiment_satisfied_alt,
                        size: 22,
                        color: Colors.grey[400],
                      ),
                    ),
                    onSubmitted: (_) => _send(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [kPrimaryBlue, kDarkBlue],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: kPrimaryBlue.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: IconButton(
                  onPressed: _send,
                  icon: const Icon(
                    Icons.send_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                  padding: const EdgeInsets.all(12),
                  constraints: const BoxConstraints(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime t) {
    return '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
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