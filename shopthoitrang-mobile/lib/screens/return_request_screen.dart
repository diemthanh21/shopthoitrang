import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import '../models/order_model.dart';
import '../providers/auth_provider.dart';
import '../services/trahang_service.dart';
import '../services/storage_service.dart';

class ReturnRequestScreen extends StatefulWidget {
  final Order order;
  const ReturnRequestScreen({super.key, required this.order});

  @override
  State<ReturnRequestScreen> createState() => _ReturnRequestScreenState();
}

class _ReturnRequestScreenState extends State<ReturnRequestScreen> {
  static const Color primaryOcean = Color(0xFF006B96);
  static const Color lightOcean = Color(0xFF0088BD);
  static const Color darkOcean = Color(0xFF004D6D);
  static const Color accentOcean = Color(0xFF00A8E8);
  static const Color backgroundOcean = Color(0xFFE8F4F8);

  final List<_ReturnSelection> _selections = [];
  List<Map<String, dynamic>> _returnableItems = [];
  bool _loadingItems = true;
  String? _itemsError;
  final _reasonCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  bool _submitting = false;
  final List<File> _images = [];
  File? _videoEvidence;
  final ImagePicker _picker = ImagePicker();
  bool _hasGiftItems = false;
  static const int _maxImageCount = 5;
  static const int _maxMediaBytes = 50 * 1024 * 1024;

  @override
  void dispose() {
    _reasonCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _fetchReturnableItems();
  }

  Future<void> _fetchReturnableItems() async {
    setState(() {
      _loadingItems = true;
      _itemsError = null;
    });
    try {
      final orderId = widget.order.id;
      if (orderId == null) {
        throw Exception('Đơn hàng không hợp lệ');
      }
      final auth = context.read<AuthProvider>();
      final maKhachHang = auth.user?.maKhachHang;
      final data = await trahangService.getReturnableItems(
        orderId,
        customerId: maKhachHang,
      );
      if (data == null) {
        throw Exception(trahangService.lastError ?? 'Không thể tải sản phẩm đủ điều kiện trả');
      }
      if (!mounted) return;
      final normalized = data
          .whereType<Map<String, dynamic>>()
          .map((item) {
            final map = Map<String, dynamic>.from(item);
            map['available_to_return'] = _asInt(
              map['available_to_return'] ?? map['availableToReturn'] ?? map['available'] ?? 0,
            );
            map['ordered_qty'] = _asInt(map['ordered_qty'] ?? map['orderedQty'] ?? map['soluong'] ?? 0);
            map['returned_qty'] = _asInt(map['returned_qty'] ?? map['returnedQty'] ?? 0);
            final price = _asInt(map['dongia'] ?? map['price'] ?? 0);
            map['is_gift'] = price <= 0 || map['isGift'] == true;
            return map;
          })
          .where((item) => (item['available_to_return'] ?? 0) > 0)
          .toList();
      final filtered = normalized.where((item) => item['is_gift'] != true).toList();

      setState(() {
        _returnableItems = filtered;
        _hasGiftItems = normalized.any((item) => item['is_gift'] == true);
        _selections
          ..clear()
          ..addAll(filtered.isNotEmpty
              ? [
                  _ReturnSelection(
                    productIndex: _firstAvailableVariantIndex(filtered),
                    quantity: 1,
                  )
                ]
              : []);
        _loadingItems = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _itemsError = e.toString();
        _returnableItems = [];
        _selections.clear();
        _loadingItems = false;
      });
    }
  }

  Future<bool> _validateFileSize(File file) async {
    final size = await file.length();
    if (size > _maxMediaBytes) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Kich thuoc tap tin khong duoc vuot 50MB.'),
          ),
        );
      }
      return false;
    }
    return true;
  }

  Future<void> _pickImage() async {
    if (_images.length >= _maxImageCount) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chi duoc chon toi da 5 hinh anh.')),
        );
      }
      return;
    }
    // Request permission based on Android version
    PermissionStatus status;

    if (Platform.isAndroid) {
      // Android 13+ (API 33+) requires READ_MEDIA_IMAGES
      if (await Permission.photos.isGranted ||
          await Permission.storage.isGranted) {
        status = PermissionStatus.granted;
      } else {
        // Try photos first (Android 13+), fallback to storage
        status = await Permission.photos.request();
        if (status.isDenied) {
          status = await Permission.storage.request();
        }
      }
    } else {
      // iOS
      status = await Permission.photos.request();
    }

    if (status.isGranted) {
      try {
        final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
        if (pickedFile != null && mounted) {
            final file = File(pickedFile.path);
            if (!await _validateFileSize(file)) return;
            setState(() => _images.add(file));
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Lỗi khi chọn ảnh: $e')));
        }
      }
    } else if (status.isPermanentlyDenied) {
      if (mounted) {
        // Show dialog to open settings
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

  Future<void> _pickVideo() async {
    if (_videoEvidence != null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chỉ chọn tối đa 1 video minh chứng.')),
        );
      }
      return;
    }
    // Request permission
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
        final pickedFile = await _picker.pickVideo(source: ImageSource.gallery);
        if (pickedFile != null && mounted) {
          final file = File(pickedFile.path);
          if (!await _validateFileSize(file)) return;
          setState(() => _videoEvidence = file);
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Loi khi chon video: $e')),
          );
        }
      }
    } else if (status.isPermanentlyDenied) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Can quyen truy cap'),
            content: const Text(
              'Ung dung can quyen truy cap thu vien video. Vui long bat quyen trong Cai dat.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Dong'),
              ),
              TextButton(
                onPressed: () {
                  openAppSettings();
                  Navigator.pop(context);
                },
                child: const Text('Mo Cai dat'),
              ),
            ],
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Can cap quyen truy cap video')),
        );
      }
    }
  }

  void _removeImage(int index) {
    setState(() => _images.removeAt(index));
  }

  void _removeVideo() {
    setState(() => _videoEvidence = null);
  }

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (_loadingItems) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_itemsError != null) {
      body = _buildErrorState();
    } else if (_returnableItems.isEmpty) {
      body = _buildEmptyState();
    } else {
      body = SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildOrderInfoCard(),
            const SizedBox(height: 12),
            _buildSelectionsCard(),
            if (_hasGiftItems) ...[
              const SizedBox(height: 12),
              _buildGiftWarning(),
            ],
            const SizedBox(height: 16),
            _buildReasonCard(),
            const SizedBox(height: 16),
            _buildNoteField(),
            const SizedBox(height: 16),
            _buildMediaCard(),
            const SizedBox(height: 24),
            _buildSubmitButton(),
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: backgroundOcean,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Tạo yêu cầu trả hàng',
          style: TextStyle(
            color: Colors.white,
            fontSize: 19,
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: primaryOcean,
        elevation: 0,
        centerTitle: true,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [primaryOcean, lightOcean],
            ),
          ),
        ),
      ),
      body: body,
    );
  }

  Widget _buildSubmitButton() {
    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: _submitting
              ? [Colors.grey.shade400, Colors.grey.shade500]
              : [lightOcean, accentOcean],
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: _submitting
            ? []
            : [
                BoxShadow(
                  color: lightOcean.withOpacity(0.35),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
      ),
      child: ElevatedButton(
        onPressed: _submitting ? null : _submit,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          disabledBackgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: _submitting
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  color: Colors.white,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.send, color: Colors.white, size: 20),
                  SizedBox(width: 10),
                  Text(
                    'Gửi yêu cầu',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _oceanCard({required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: primaryOcean.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _buildOrderInfoCard() {
    return _oceanCard(
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: accentOcean.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.receipt_long_outlined,
                color: primaryOcean,
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Mã đơn hàng',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.black54,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '#${widget.order.id ?? '---'}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: darkOcean,
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSelectionsCard() {
    return _oceanCard(
      children: [
        Row(
          children: const [
            Icon(Icons.shopping_bag_outlined, color: primaryOcean),
            SizedBox(width: 8),
            Text(
              'Sản phẩm trả',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: darkOcean,
              ),
            ),
            SizedBox(width: 4),
            Text('*', style: TextStyle(color: Colors.red, fontSize: 16)),
          ],
        ),
        const SizedBox(height: 14),
        if (_selections.isEmpty)
          const Text('Không có sản phẩm nào đủ điều kiện trả.'),
        ...List.generate(_selections.length, (index) => _buildSelectionBlock(index)),
        if (_canAddMoreSelections) ...[
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _addSelection,
            icon: const Icon(Icons.add_circle_outline),
            label: const Text('Thêm sản phẩm trả'),
            style: OutlinedButton.styleFrom(
              foregroundColor: lightOcean,
              side: const BorderSide(color: lightOcean),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildGiftWarning() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Icon(Icons.info_outline, color: Colors.orange, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              '�?ám bảo trả kèm sản phẩm khuyến mãi đi cùng. Quà tặng không được đổi trả riêng lẻ.',
              style: TextStyle(
                color: Colors.orange,
                fontWeight: FontWeight.w600,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectionBlock(int index) {
    final selection = _selections[index];
    final item = _selectedItem(index);
    final maxQty = _maxSelectableQuantity(index);
    final int currentIndex = _returnableItems.isEmpty
        ? 0
        : selection.productIndex.clamp(0, _returnableItems.length - 1).toInt();
    // Build dropdown options only for variants that still have remaining capacity
    final productItems = <DropdownMenuItem<int>>[];
    for (int i = 0; i < _returnableItems.length; i++) {
      final target = _returnableItems[i];
      final name = target['tensanpham'] ?? target['tenSanPham'] ?? 'Sản phẩm #${target['machitietsanpham']}';
      final color = target['mausac'];
      final size = target['kichthuoc'];
      final label = [
        name,
        if (color != null) '• Màu ${color.toString()}',
        if (size != null) '• Size ${size.toString()}',
      ].join(' ');

      final remaining = _remainingForVariantIndex(i, excludeSelectionIndex: index);
      // Include option if there is remaining capacity OR it's the currently selected value for this block
      if (remaining > 0 || i == currentIndex) {
        productItems.add(DropdownMenuItem(
          value: i,
          child: Text(
            label,
            style: const TextStyle(fontSize: 14),
            maxLines: 2,
            overflow: TextOverflow.visible,
            softWrap: true,
          ),
        ));
      }
    }

    return Container(
      margin: EdgeInsets.only(bottom: index == _selections.length - 1 ? 0 : 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: backgroundOcean.withOpacity(0.6),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: lightOcean.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.tag, color: primaryOcean, size: 18),
              ),
              const SizedBox(width: 8),
              Text(
                'Sản phẩm #${index + 1}',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: darkOcean,
                ),
              ),
              const Spacer(),
              if (_selections.length > 1)
                IconButton(
                  onPressed: () => _removeSelection(index),
                  icon: const Icon(Icons.delete_forever, color: Colors.redAccent, size: 20),
                  tooltip: 'Xoá sản phẩm này',
                ),
            ],
          ),
          SizedBox(
            width: double.infinity,
            child: DropdownButtonFormField<int>(
              isExpanded: true,
              value: currentIndex,
              decoration: InputDecoration(
                labelText: 'Chọn biến thể',
                labelStyle: const TextStyle(color: primaryOcean, fontWeight: FontWeight.w600),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: lightOcean.withOpacity(0.3)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: lightOcean, width: 2),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
              // Allow menu items and selected text to wrap to two lines so the widget grows vertically
              items: productItems,
              selectedItemBuilder: (context) => productItems.map((item) {
                final label = (item.child is Text) ? (item.child as Text).data ?? '' : item.child.toString();
                return Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    label,
                    maxLines: 2,
                    softWrap: true,
                    overflow: TextOverflow.visible,
                  ),
                );
              }).toList(),
              onChanged: (value) {
                if (value == null) return;
                setState(() {
                  selection.productIndex = value;
                  selection.quantity = 1;
                });
              },
            ),
          ),
          if (item != null) ...[
            const SizedBox(height: 8),
            Text(
              'Còn có thể trả: ${item['available_to_return']} sản phẩm',
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              const Text(
                'Số lượng',
                style: TextStyle(fontWeight: FontWeight.w700, color: darkOcean),
              ),
              const SizedBox(width: 12),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: lightOcean),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: selection.quantity > 1
                          ? () => setState(() => selection.quantity--)
                          : null,
                      icon: const Icon(Icons.remove_circle_outline),
                      color:
                          selection.quantity > 1 ? lightOcean : Colors.grey,
                    ),
                    Container(
                      constraints: const BoxConstraints(minWidth: 40),
                      alignment: Alignment.center,
                      child: Text(
                        '${selection.quantity}',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: darkOcean,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: maxQty > selection.quantity
                          ? () => setState(() => selection.quantity++)
                          : null,
                      icon: const Icon(Icons.add_circle_outline),
                      color: maxQty > selection.quantity
                          ? lightOcean
                          : Colors.grey,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Text(
                '(Tối đa: $maxQty)',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReasonCard() {
    return _oceanCard(
      children: [
        Row(
          children: const [
            Icon(Icons.edit_note, color: primaryOcean),
            SizedBox(width: 8),
            Text(
              'Lý do trả hàng',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: darkOcean,
              ),
            ),
            SizedBox(width: 4),
            Text('*', style: TextStyle(color: Colors.red, fontSize: 16)),
          ],
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _reasonCtrl,
          maxLines: 4,
          decoration: InputDecoration(
            hintText: 'Mô tả chi tiết lý do (ví dụ: sản phẩm lỗi, thiếu phụ kiện...)',
            hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: lightOcean.withOpacity(0.3)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: lightOcean.withOpacity(0.3)),
            ),
            focusedBorder: const OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(12)),
              borderSide: BorderSide(color: lightOcean, width: 2),
            ),
            contentPadding: const EdgeInsets.all(14),
            filled: true,
            fillColor: backgroundOcean.withOpacity(0.4),
          ),
        ),
      ],
    );
  }

  Widget _buildNoteField() {
    return _oceanCard(
      children: [
        Row(
          children: const [
            Icon(Icons.sticky_note_2_outlined, color: primaryOcean),
            SizedBox(width: 8),
            Text(
              'Ghi chú bổ sung (không bắt buộc)',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: darkOcean,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _noteCtrl,
          maxLines: 2,
          decoration: InputDecoration(
            hintText: 'Ví dụ: muốn nhận hỗ trợ đổi sang size khác',
            hintStyle: TextStyle(color: Colors.grey[400]),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: lightOcean.withOpacity(0.3)),
            ),
            focusedBorder: const OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(12)),
              borderSide: BorderSide(color: lightOcean, width: 2),
            ),
            filled: true,
            fillColor: backgroundOcean.withOpacity(0.3),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildMediaCard() {
    return _oceanCard(
      children: [
        Row(
          children: const [
            Icon(Icons.add_photo_alternate_outlined, color: primaryOcean),
            SizedBox(width: 8),
            Text(
              'Minh chứng (ảnh/video)',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: darkOcean,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Tối đa 5 ảnh và 1 video, mỗi tệp ≤ 50MB. Vui lòng cung cấp ít nhất một minh chứng để hỗ trợ duyệt yêu cầu nhanh hơn.',
          style: TextStyle(fontSize: 13, color: Colors.grey[600], height: 1.4),
        ),
        const SizedBox(height: 14),
        if (_images.isNotEmpty)
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: List.generate(_images.length, (i) {
              return Stack(
                clipBehavior: Clip.none,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.file(
                      _images[i],
                      width: 90,
                      height: 90,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    top: -6,
                    right: -6,
                    child: GestureDetector(
                      onTap: () => _removeImage(i),
                      child: Container(
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        padding: const EdgeInsets.all(4),
                        child: const Icon(Icons.close, color: Colors.white, size: 16),
                      ),
                    ),
                  ),
                ],
              );
            }),
          )
        else
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: backgroundOcean,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.image_outlined, color: Colors.grey[600]),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Chưa có hình ảnh chứng minh nào.',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ),
              ],
            ),
          ),
        if (_videoEvidence != null) ...[
          const SizedBox(height: 16),
          _buildVideoPreview(),
        ],
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _pickImage,
                icon: const Icon(Icons.photo_library_outlined),
                label: Text('Thêm ảnh (${_images.length}/$_maxImageCount)'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: lightOcean,
                  side: const BorderSide(color: lightOcean),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _pickVideo,
                icon: const Icon(Icons.videocam_outlined),
                label: Text(_videoEvidence == null ? 'Thêm video' : 'Đổi video'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: darkOcean,
                  side: BorderSide(color: darkOcean.withOpacity(0.6)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildVideoPreview() {
    final file = _videoEvidence;
    if (file == null) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: backgroundOcean.withOpacity(0.6),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: lightOcean.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.movie, color: primaryOcean),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _fileName(file),
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: darkOcean,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Video minh chứng',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _removeVideo,
            icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
          const SizedBox(height: 12),
          Text(
            _itemsError ?? 'Không thể tải dữ liệu',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _fetchReturnableItems,
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: const [
          Icon(Icons.inventory_2_outlined, size: 48, color: Colors.grey),
          SizedBox(height: 12),
          Text('Đơn hàng không còn sản phẩm đủ điều kiện trả.'),
        ],
      ),
    );
  }

  Map<String, dynamic>? _selectedItem(int index) {
    if (_returnableItems.isEmpty) return null;
    if (index < 0 || index >= _selections.length) return null;
    final selection = _selections[index];
    if (selection.productIndex < 0 || selection.productIndex >= _returnableItems.length) {
      selection.productIndex = 0;
    }
    return _returnableItems[selection.productIndex];
  }

  int _maxSelectableQuantity(int index) {
    final item = _selectedItem(index);
    if (item == null) return 0;
    final available = _asInt(item['available_to_return']);
    final variantId = item['machitietsanpham'];
    int reservedByOthers = 0;
    for (int i = 0; i < _selections.length; i++) {
      if (i == index) continue;
      final otherItem = _selectedItem(i);
      if (otherItem == null) continue;
      if (otherItem['machitietsanpham'] == variantId) {
        reservedByOthers += _selections[i].quantity;
      }
    }
    final remaining = available - reservedByOthers;
    return remaining < 0 ? 0 : remaining;
  }

  bool get _canAddMoreSelections {
    if (_returnableItems.isEmpty) return false;
    final usage = <dynamic, int>{};
    for (final selection in _selections) {
      final item = _returnableItems[selection.productIndex];
      final key = item['machitietsanpham'];
      usage[key] = (usage[key] ?? 0) + selection.quantity;
    }
    for (final item in _returnableItems) {
      final key = item['machitietsanpham'];
      final available = _asInt(item['available_to_return']);
      final used = usage[key] ?? 0;
      if (available - used > 0) {
        return true;
      }
    }
    return false;
  }

  void _addSelection() {
    if (_returnableItems.isEmpty) return;
    final idx = _firstAvailableVariantIndex(_returnableItems);
    if (idx < 0) return;
    setState(() {
      _selections.add(_ReturnSelection(productIndex: idx, quantity: 1));
    });
  }

  void _removeSelection(int index) {
    if (index < 0 || index >= _selections.length) return;
    setState(() {
      _selections.removeAt(index);
    });
  }

  Map<int, int> _aggregateSelections() {
    final Map<int, int> result = {};
    final Map<int, int> capacity = {};
    for (final item in _returnableItems) {
      final variantIdDynamic = item['machitietsanpham'];
      if (variantIdDynamic == null) continue;
      final variantId = _asInt(variantIdDynamic);
      capacity[variantId] = _asInt(item['available_to_return']);
    }
    for (final selection in _selections) {
      if (_returnableItems.isEmpty) break;
      final item = _returnableItems[selection.productIndex];
      final variantIdDynamic = item['machitietsanpham'];
      if (variantIdDynamic == null) continue;
      final variantId = _asInt(variantIdDynamic);
      final remaining = capacity[variantId] ?? 0;
      if (remaining <= 0) continue;
      final take = selection.quantity <= remaining ? selection.quantity : remaining;
      if (take <= 0) continue;
      capacity[variantId] = remaining - take;
      result[variantId] = (result[variantId] ?? 0) + take;
    }
    return result;
  }

  Map<String, dynamic>? _findItemByVariant(int variantId) {
    for (final item in _returnableItems) {
      if (_asInt(item['machitietsanpham']) == variantId) {
        return item;
      }
    }
    return null;
  }

  String _fileName(File file) {
    final normalized = file.path.replaceAll('\\', '/');
    final segments = normalized.split('/');
    return segments.isNotEmpty ? segments.last : normalized;
  }

  int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) {
      return int.tryParse(value) ?? 0;
    }
    return 0;
  }

  /// Return remaining capacity for a variant at [variantIndex] (index in _returnableItems)
  /// excluding quantities reserved by selection at [excludeSelectionIndex].
  int _remainingForVariantIndex(int variantIndex, {int excludeSelectionIndex = -1}) {
    if (_returnableItems.isEmpty) return 0;
    if (variantIndex < 0 || variantIndex >= _returnableItems.length) return 0;
    final variant = _returnableItems[variantIndex];
    final variantId = variant['machitietsanpham'];
    final capacity = _asInt(variant['available_to_return']);
    int used = 0;
    for (int i = 0; i < _selections.length; i++) {
      if (i == excludeSelectionIndex) continue;
      final sel = _selections[i];
      if (sel.productIndex < 0 || sel.productIndex >= _returnableItems.length) continue;
      final selVariantId = _returnableItems[sel.productIndex]['machitietsanpham'];
      if (selVariantId == variantId) used += sel.quantity;
    }
    final remaining = capacity - used;
    return remaining < 0 ? 0 : remaining;
  }

  /// Find first variant index that still has available quantity (considering current selections)
  int _firstAvailableVariantIndex([List<Map<String, dynamic>>? items]) {
    final list = items ?? _returnableItems;
    if (list.isEmpty) return -1;
    for (int i = 0; i < list.length; i++) {
      final cap = _asInt(list[i]['available_to_return']);
      // compute used from current selections (only those mapped to indices inside _returnableItems)
      int used = 0;
      for (final sel in _selections) {
        if (sel.productIndex >= 0 && sel.productIndex < _returnableItems.length) {
          final selId = _returnableItems[sel.productIndex]['machitietsanpham'];
          if (selId == list[i]['machitietsanpham']) used += sel.quantity;
        }
      }
      if (cap - used > 0) return i;
    }
    return -1;
  }

  Future<void> _submit() async {
    if (_returnableItems.isEmpty || _selections.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không có sản phẩm nào để trả.')),
      );
      return;
    }
    final orderId = widget.order.id;
    if (orderId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đơn hàng không hợp lệ')),
      );
      return;
    }
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.user == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Vui lòng đăng nhập trước')));
      return;
    }
    final reason = _reasonCtrl.text.trim();
    if (reason.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Vui lòng nhập lý do')));
      return;
    }

    final aggregated = _aggregateSelections();
    if (aggregated.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Vui lòng chọn sản phẩm hợp lệ')));
      return;
    }

    setState(() => _submitting = true);

    final bool hasImages = _images.isNotEmpty;
    final bool hasVideo = _videoEvidence != null;
    if (!hasImages && !hasVideo) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng bổ sung hình ảnh hoặc video minh chứng.')),
      );
      return;
    }
    if (_images.length > _maxImageCount) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Chỉ được chọn tối đa $_maxImageCount hình ảnh.')),
      );
      return;
    }

    String extOf(File f) {
      final name = _fileName(f);
      final idx = name.lastIndexOf('.');
      return idx >= 0 ? name.substring(idx + 1).toLowerCase() : '';
    }

    final allowedImages = <String>{'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'};
    final allowedVideos = <String>{'mp4', 'mov', 'avi', 'mkv', 'webm'};

    for (final img in _images) {
      final ext = extOf(img);
      if (ext.isEmpty || !allowedImages.contains(ext)) {
        if (!mounted) return;
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng chọn ảnh định dạng JPG/PNG/WebP.')),
        );
        return;
      }
      if (!await _validateFileSize(img)) {
        if (!mounted) return;
        setState(() => _submitting = false);
        return;
      }
    }

    if (hasVideo) {
      final video = _videoEvidence!;
      final ext = extOf(video);
      if (ext.isEmpty || !allowedVideos.contains(ext)) {
        if (!mounted) return;
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Định dạng video không được hỗ trợ.')),
        );
        return;
      }
      if (!await _validateFileSize(video)) {
        if (!mounted) return;
        setState(() => _submitting = false);
        return;
      }
    }

    final storage = StorageService();
    final List<String> uploadedPaths = [];
    final mediaFiles = <File>[
      ..._images,
      if (_videoEvidence != null) _videoEvidence!,
    ];
    try {
      for (final media in mediaFiles) {
        final path = await storage.uploadReturnMedia(
          orderId: orderId,
          file: File(media.path),
        );
        uploadedPaths.add(path);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi upload minh chứng: $e')),
      );
      return;
    }
    final note = _noteCtrl.text.trim();

    for (final entry in aggregated.entries) {
      final variantId = entry.key;
      final qty = entry.value;
      final itemInfo = _findItemByVariant(variantId);
      if (itemInfo == null) {
        continue;
      }
      final payload = {
        'madonhang': orderId,
        'makhachhang': auth.user!.maKhachHang,
        'machitietsanpham': variantId,
        'soluong': qty,
        'lydo': reason,
        'hinhanhloi': uploadedPaths.isNotEmpty ? uploadedPaths.join(',') : null,
        'ghichu': note.isNotEmpty ? note : null,
      };

      final res = await trahangService.createReturn(payload);
      if (res == null) {
        if (!mounted) return;
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(trahangService.lastError ?? 'Lỗi khi gửi yêu cầu')),
        );
        return;
      }
    }

    if (!mounted) return;
    setState(() => _submitting = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã gửi ${aggregated.length} yêu cầu trả hàng'),
      ),
    );
    Navigator.pop(context, true);
  }
}

class _ReturnSelection {
  int productIndex;
  int quantity;

  _ReturnSelection({required this.productIndex, this.quantity = 1});
}
