import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/order_model.dart';
import '../services/review_service.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class ReviewScreen extends StatefulWidget {
  final Order order;
  final OrderItem? item; // Nếu null thì đánh giá toàn bộ đơn

  const ReviewScreen({
    super.key,
    required this.order,
    this.item,
  });

  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  int _rating = 5;
  final _commentCtrl = TextEditingController();
  bool _submitting = false;
  final List<File> _images = [];
  final ImagePicker _picker = ImagePicker();

  // Các tiêu chí đánh giá theo từng mức sao
  final Map<int, String> _ratingLabels = {
    5: 'Tuyệt vời',
    4: 'Hài lòng',
    3: 'Bình thường',
    2: 'Không hài lòng',
    1: 'Tệ',
  };

  final Map<int, List<String>> _quickComments = {
    5: [
      'Chất lượng tuyệt vời',
      'Đóng gói cẩn thận',
      'Giao hàng nhanh',
      'Giống mô tả',
      'Sẽ mua lại'
    ],
    4: [
      'Sản phẩm tốt',
      'Đúng như mong đợi',
      'Giao hàng đúng hẹn',
      'Giá cả hợp lý'
    ],
    3: ['Bình thường', 'Tạm được', 'Có thể cải thiện', 'Giao hàng hơi chậm'],
    2: [
      'Không như mong đợi',
      'Chất lượng kém',
      'Giao hàng chậm',
      'Hơi thất vọng'
    ],
    1: ['Rất tệ', 'Không đúng mô tả', 'Không đáng tiền', 'Sẽ không mua lại'],
  };

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    PermissionStatus status;

    if (Platform.isAndroid) {
      if (await Permission.photos.isGranted ||
          await Permission.storage.isGranted) {
        status = PermissionStatus.granted;
      } else {
        status = await Permission.photos.request();
        if (status.isDenied) {
          status = await Permission.storage.request();
        }
      }
    } else {
      status = await Permission.photos.request();
    }

    if (status.isGranted) {
      try {
        final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
        if (pickedFile != null && mounted) {
          setState(() => _images.add(File(pickedFile.path)));
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi khi chọn ảnh: $e')),
          );
        }
      }
    } else if (status.isPermanentlyDenied) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Cần quyền truy cập'),
            content: const Text(
              'Ứng dụng cần quyền truy cập thư viện ảnh. Vui lòng bật quyền trong Cài đặt.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Huỷ'),
              ),
              TextButton(
                onPressed: () {
                  openAppSettings();
                  Navigator.pop(context);
                },
                child: const Text('Mở Cài đặt'),
              ),
            ],
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cần cấp quyền truy cập thư viện ảnh')),
        );
      }
    }
  }

  void _removeImage(int index) {
    setState(() => _images.removeAt(index));
  }

  void _addQuickComment(String text) {
    final current = _commentCtrl.text;
    if (current.isEmpty) {
      _commentCtrl.text = text;
    } else if (!current.contains(text)) {
      _commentCtrl.text = '$current. $text';
    }
  }

  Future<void> _submit() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng đăng nhập')),
      );
      return;
    }

    if (_rating < 1 || _rating > 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn số sao')),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      // Nếu đánh giá cho 1 sản phẩm cụ thể
      if (widget.item != null) {
        final result = await reviewService.createReview(
          productId: widget.item!.productId!,
          customerId: auth.user!.maKhachHang,
          rating: _rating,
          comment: _commentCtrl.text.trim(),
          images: _images.map((f) => f.path).join(','),
          orderDetailId: widget.item!.id,
        );

        if (mounted) {
          if (result != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Đánh giá thành công!'),
                backgroundColor: Colors.green,
              ),
            );
            Navigator.pop(context, true);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content:
                    Text(reviewService.lastError ?? 'Lỗi khi gửi đánh giá'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      } else {
        // Đánh giá cho tất cả sản phẩm trong đơn
        bool allSuccess = true;
        for (var item in widget.order.items) {
          final result = await reviewService.createReview(
            productId: item.productId!,
            customerId: auth.user!.maKhachHang,
            rating: _rating,
            comment: _commentCtrl.text.trim(),
            images: _images.map((f) => f.path).join(','),
            orderDetailId: item.id,
          );
          if (result == null) {
            allSuccess = false;
            break;
          }
        }

        if (mounted) {
          if (allSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Đánh giá thành công!'),
                backgroundColor: Colors.green,
              ),
            );
            Navigator.pop(context, true);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content:
                    Text(reviewService.lastError ?? 'Lỗi khi gửi đánh giá'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.item != null ? [widget.item!] : widget.order.items;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Đánh giá sản phẩm',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: items.isEmpty
          ? const Center(child: Text('Không có sản phẩm để đánh giá'))
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product info
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children:
                          items.map((item) => _buildProductItem(item)).toList(),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Rating section
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Chất lượng sản phẩm',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Stars
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(5, (i) {
                            return GestureDetector(
                              onTap: () => setState(() => _rating = i + 1),
                              child: Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 8),
                                child: Icon(
                                  Icons.star,
                                  size: 40,
                                  color: i < _rating
                                      ? Colors.orange
                                      : Colors.grey[300],
                                ),
                              ),
                            );
                          }),
                        ),
                        const SizedBox(height: 8),
                        Center(
                          child: Text(
                            _ratingLabels[_rating] ?? '',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w500,
                              color: Colors.orange[700],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Quick comments
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Nhận xét nhanh',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.black54,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: (_quickComments[_rating] ?? [])
                              .map(
                                (text) => InkWell(
                                  onTap: () => _addQuickComment(text),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      border:
                                          Border.all(color: Colors.grey[300]!),
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Text(
                                      text,
                                      style: const TextStyle(fontSize: 13),
                                    ),
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Comment section
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextField(
                          controller: _commentCtrl,
                          maxLines: 5,
                          decoration: InputDecoration(
                            hintText:
                                'Hãy chia sẻ nhận xét cho sản phẩm này bạn nhé!',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            contentPadding: const EdgeInsets.all(12),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Thêm hình ảnh',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 100,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            children: [
                              // Add image button
                              InkWell(
                                onTap: _pickImage,
                                child: Container(
                                  width: 100,
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: Colors.grey[300]!,
                                      style: BorderStyle.solid,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.camera_alt,
                                          size: 32, color: Colors.grey[400]),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Thêm ảnh',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              // Preview images
                              ..._images.asMap().entries.map((entry) {
                                final index = entry.key;
                                final file = entry.value;
                                return Container(
                                  margin: const EdgeInsets.only(left: 8),
                                  width: 100,
                                  child: Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: Image.file(
                                          file,
                                          width: 100,
                                          height: 100,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      Positioned(
                                        top: 4,
                                        right: 4,
                                        child: InkWell(
                                          onTap: () => _removeImage(index),
                                          child: Container(
                                            padding: const EdgeInsets.all(4),
                                            decoration: const BoxDecoration(
                                              color: Colors.black54,
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(
                                              Icons.close,
                                              color: Colors.white,
                                              size: 16,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 80),
                ],
              ),
            ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 4,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: ElevatedButton(
            onPressed: _submitting ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: _submitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Hoàn thành',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductItem(OrderItem item) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              item.imageUrl ?? '',
              width: 60,
              height: 60,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                width: 60,
                height: 60,
                color: Colors.grey[300],
                child: const Icon(Icons.image, color: Colors.white),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.productName ?? 'Sản phẩm',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (item.variantName != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Phân loại: ${item.variantName}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
