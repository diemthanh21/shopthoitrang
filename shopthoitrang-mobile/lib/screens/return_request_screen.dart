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
  final List<_ReturnSelection> _selections = [];
  List<Map<String, dynamic>> _returnableItems = [];
  bool _loadingItems = true;
  String? _itemsError;
  final _reasonCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  bool _submitting = false;
  final List<File> _images = [];
  final ImagePicker _picker = ImagePicker();

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
            return map;
          })
          .where((item) => (item['available_to_return'] ?? 0) > 0)
          .toList();

      setState(() {
        _returnableItems = normalized;
        _selections
          ..clear()
          ..addAll(normalized.isNotEmpty
              ? [
                  _ReturnSelection(
                    productIndex: _firstAvailableVariantIndex(normalized),
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

  Future<void> _pickImage() async {
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
          setState(() => _images.add(File(pickedFile.path)));
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

  void _removeImage(int index) {
    setState(() => _images.removeAt(index));
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
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildOrderInfoCard(),
            const SizedBox(height: 12),
            _buildSelectionsCard(),
            const SizedBox(height: 16),
            _buildReasonCard(),
            const SizedBox(height: 16),
            _buildMediaCard(),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  elevation: 2,
                ),
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Gửi yêu cầu',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Tạo yêu cầu trả hàng',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: body,
    );
  }

  Widget _buildOrderInfoCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(Icons.receipt_outlined, color: Colors.orange.shade700, size: 20),
          const SizedBox(width: 8),
          Text(
            'Đơn hàng #${widget.order.id ?? '---'}',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectionsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Text(
                'Sản phẩm trả',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              SizedBox(width: 4),
              Text('*', style: TextStyle(color: Colors.red, fontSize: 15)),
            ],
          ),
          const SizedBox(height: 12),
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
                foregroundColor: Colors.orange,
                side: const BorderSide(color: Colors.orange),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
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
      margin: EdgeInsets.only(bottom: index == _selections.length - 1 ? 0 : 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Sản phẩm #${index + 1}',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              if (_selections.length > 1)
                IconButton(
                  onPressed: () => _removeSelection(index),
                  icon: const Icon(Icons.delete_forever, color: Colors.redAccent),
                  tooltip: 'Xoá sản phẩm này',
                ),
            ],
          ),
          SizedBox(
            width: double.infinity,
            child: DropdownButtonFormField<int>(
              isExpanded: true,
              initialValue: currentIndex,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 12),
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.orange),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: selection.quantity > 1
                          ? () => setState(() => selection.quantity--)
                          : null,
                      icon: const Icon(Icons.remove_circle_outline),
                      color:
                          selection.quantity > 1 ? Colors.orange : Colors.grey,
                    ),
                    Container(
                      constraints: const BoxConstraints(minWidth: 40),
                      alignment: Alignment.center,
                      child: Text(
                        '${selection.quantity}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: maxQty > selection.quantity
                          ? () => setState(() => selection.quantity++)
                          : null,
                      icon: const Icon(Icons.add_circle_outline),
                      color: maxQty > selection.quantity
                          ? Colors.orange
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
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Text(
                'Lý do',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              SizedBox(width: 4),
              Text('*', style: TextStyle(color: Colors.red, fontSize: 15)),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _reasonCtrl,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Mô tả lý do trả hàng (VD: Sản phẩm bị lỗi, không đúng size...)',
              hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Colors.orange, width: 2),
              ),
              contentPadding: const EdgeInsets.all(12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMediaCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.add_photo_alternate_outlined,
                  color: Colors.orange.shade700, size: 20),
              const SizedBox(width: 8),
              const Text(
                'Hình ảnh minh chứng',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Tải lên hình ảnh hoặc video (bắt buộc khi shop yêu cầu).',
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
          const SizedBox(height: 12),
          if (_images.isNotEmpty)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: List.generate(_images.length, (i) {
                return Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(
                        _images[i],
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Positioned(
                      top: 2,
                      right: 2,
                      child: GestureDetector(
                        onTap: () => _removeImage(i),
                        child: Container(
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              }),
            ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pickImage,
            icon: const Icon(Icons.add_photo_alternate),
            label: const Text('Thêm hình ảnh'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.orange,
              side: const BorderSide(color: Colors.orange),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
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

    // Validate files: require either >=3 images (each <= 5MB) OR exactly 1 video (<= 30MB)
    final files = _images;
    const int maxImageBytes = 5 * 1024 * 1024; // 5MB per image
    const int maxVideoBytes = 30 * 1024 * 1024; // 30MB per video
    final imageExts = <String>{'jpg', 'jpeg', 'png', 'webp', 'gif'};
    final videoExts = <String>{'mp4', 'mov', 'avi', 'mkv', 'webm'};

    if (files.isEmpty) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng thêm ít nhất 3 hình hoặc 1 video')),
      );
      return;
    }

    // Helper to get lowercase extension
    String _extOf(File f) => f.path.split('.').length > 1 ? f.path.split('.').last.toLowerCase() : '';

    final hasVideo = files.any((f) => videoExts.contains(_extOf(f)));
    if (hasVideo) {
      // If any item is a video, enforce exactly 1 file and that file must be a video under maxVideoBytes
      if (files.length != 1) {
        if (!mounted) return;
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Khi tải video, chỉ được phép upload 1 file duy nhất.')),
        );
        return;
      }
      final f = files.first;
      final ext = _extOf(f);
      if (!videoExts.contains(ext)) {
        if (!mounted) return;
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Định dạng video không được hỗ trợ.')),
        );
        return;
      }
      final size = await f.length();
      if (size > maxVideoBytes) {
        if (!mounted) return;
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Kích thước video quá lớn (tối đa ${maxVideoBytes ~/ (1024 * 1024)}MB).')),
        );
        return;
      }
    } else {
      // Expect images: at least 3, each not exceeding maxImageBytes and correct extension
      if (files.length < 3) {
        if (!mounted) return;
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng thêm ít nhất 3 hình ảnh minh chứng')),
        );
        return;
      }
      for (final f in files) {
        final ext = _extOf(f);
        if (!imageExts.contains(ext)) {
          if (!mounted) return;
          setState(() => _submitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Một hoặc nhiều tệp không phải ảnh (jpg/png/webp).')),
          );
          return;
        }
        final size = await f.length();
        if (size > maxImageBytes) {
          if (!mounted) return;
          setState(() => _submitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Kích thước ảnh quá lớn (tối đa ${maxImageBytes ~/ (1024 * 1024)}MB mỗi ảnh).')),
          );
          return;
        }
      }
    }
    final storage = StorageService();
    final List<String> uploadedPaths = [];
    try {
      for (final img in files) {
        final path = await storage.uploadReturnMedia(
          orderId: orderId,
          file: File(img.path),
        );
        uploadedPaths.add(path);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi upload hình minh chứng: $e')),
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
