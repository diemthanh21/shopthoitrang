import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import 'package:path/path.dart' as p;
import '../models/order_model.dart';
import '../providers/auth_provider.dart';
import '../services/doihang_service.dart';
import '../services/product_service.dart';
import '../services/api_client.dart';
import '../models/product_model.dart';

class ExchangeRequestScreen extends StatefulWidget {
  final Order order;
  const ExchangeRequestScreen({Key? key, required this.order})
      : super(key: key);
  @override
  State<ExchangeRequestScreen> createState() => _ExchangeRequestScreenState();
}

class _ExchangeRequestScreenState extends State<ExchangeRequestScreen> {
  final _reasonCtrl = TextEditingController();
  bool _submitting = false;
  final ApiClient _apiClient = ApiClient();
  late final ProductService _productService = ProductService(_apiClient);
  final List<_ExchangeEntry> _entries = [];
  final ImagePicker _picker = ImagePicker();
  final List<File> _imageEvidence = [];
  final List<String> _imageEvidenceUrls = [];
  File? _videoEvidence;
  String? _videoEvidenceUrl;
  bool _uploadingEvidence = false;

  // Màu chủ đạo xanh biển
  static const Color primaryOcean = Color(0xFF006B96);
  static const Color lightOcean = Color(0xFF0088BD);
  static const Color darkOcean = Color(0xFF004D6D);
  static const Color accentOcean = Color(0xFF00A8E8);
  static const Color backgroundOcean = Color(0xFFE8F4F8);
  static const int _maxImageCount = 5;
  static const int _maxMediaBytes = 50 * 1024 * 1024;

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeEntries();
    });
  }

  void _initializeEntries() {
    if (widget.order.items.isEmpty || _entries.isNotEmpty) return;
    final nextIndex = _nextAvailableItemIndex() ?? 0;
    final entry = _ExchangeEntry(orderItemIndex: nextIndex)..loading = true;
    setState(() {
      _entries.add(entry);
    });
    _loadEntryVariants(entry);
  }

  int? _nextAvailableItemIndex() {
    if (widget.order.items.isEmpty) return null;
    final usage = <int, int>{};
    for (final entry in _entries) {
      usage.update(entry.orderItemIndex, (value) => value + entry.quantity,
          ifAbsent: () => entry.quantity);
    }
    for (var i = 0; i < widget.order.items.length; i++) {
      final ordered = widget.order.items[i].quantity;
      final used = usage[i] ?? 0;
      if (used < ordered) return i;
    }
    return null;
  }

  Future<void> _loadEntryVariants(_ExchangeEntry entry) async {
    final items = widget.order.items;
    if (items.isEmpty) return;
    if (entry.orderItemIndex < 0 || entry.orderItemIndex >= items.length) {
      return;
    }
    final old = items[entry.orderItemIndex];

    try {
      setState(() {
        entry.loading = true;
        entry.error = null;
      });
      List<ProductVariant> variants = [];
      Product? product;
      if (old.productId != null) {
        product = await _productService.getByIdWithImages(old.productId!);
      } else {
        final pwv = await _productService
            .getProductWithVariantByVariantId(old.variantId);
        product = pwv?.product;
      }
      if (product != null) {
        variants = product.variants;
      }

      final colors = <_VariantColorOption>[];
      final byColor = <int, List<_VariantSizeOption>>{};
      for (final variant in variants) {
        final colorOpt = _VariantColorOption(variant: variant);
        final sizeOptions = _buildSizeOptions(colorOpt, old);
        if (sizeOptions.isEmpty) continue;
        colors.add(colorOpt);
        byColor[colorOpt.variantId] = sizeOptions;
      }
      colors.sort((a, b) => a.label.compareTo(b.label));

      final prevColorId = entry.selectedColor?.variantId;
      _VariantColorOption? selectedColor;
      if (prevColorId != null) {
        try {
          selectedColor =
              colors.firstWhere((c) => c.variantId == prevColorId);
        } catch (_) {
          selectedColor = colors.isNotEmpty ? colors.first : null;
        }
      } else if (colors.isNotEmpty) {
        selectedColor = colors.first;
      }

      final prevSizeKey = entry.selectedSize?.key;
      List<_VariantSizeOption> sizeOptions = [];
      _VariantSizeOption? selectedSize;
      if (selectedColor != null) {
        sizeOptions = List<_VariantSizeOption>.from(
            byColor[selectedColor.variantId] ?? const []);
        if (prevSizeKey != null) {
          try {
            selectedSize =
                sizeOptions.firstWhere((opt) => opt.key == prevSizeKey);
          } catch (_) {
            selectedSize = sizeOptions.isNotEmpty ? sizeOptions.first : null;
          }
        } else if (sizeOptions.isNotEmpty) {
          selectedSize = sizeOptions.first;
        }
      }

      if (!mounted) return;
      setState(() {
        entry.colorOptions = colors;
        entry.selectedColor = selectedColor;
        entry.sizeOptions = sizeOptions;
        entry.selectedSize = selectedSize;
        entry.sizeOptionsByColor = byColor;
        entry.loading = false;
        entry.error = null;
      });
    } catch (e) {
      debugPrint('Error loading available variants: $e');
      if (!mounted) return;
      setState(() {
        entry.colorOptions = [];
        entry.selectedColor = null;
        entry.sizeOptions = [];
        entry.selectedSize = null;
        entry.sizeOptionsByColor = {};
        entry.loading = false;
        entry.error = 'Không thể tải biến thể';
      });
    }
  }

  List<_VariantSizeOption> _buildSizeOptions(
      _VariantColorOption color, OrderItem oldItem) {
    final options = <_VariantSizeOption>[];
    final variant = color.variant;
    final sizes = variant.sizes;
    if (sizes.isEmpty) {
      final opt = _VariantSizeOption(variant: variant);
      if (!_isSameSelection(opt, oldItem)) options.add(opt);
      return options;
    }
    for (final size in sizes) {
      if (size.stock <= 0) continue;
      final opt = _VariantSizeOption(variant: variant, size: size);
      if (!_isSameSelection(opt, oldItem)) options.add(opt);
    }
    options.sort((a, b) => a.label.compareTo(b.label));
    return options;
  }

  bool _isSameSelection(_VariantSizeOption option, OrderItem oldItem) {
    final sameVariant = option.variantId == oldItem.variantId;
    final newSize = option.sizeBridgeId ?? 0;
    final oldSize = oldItem.sizeBridgeId ?? 0;
    return sameVariant && newSize == oldSize;
  }

  void _onEntryColorChanged(_ExchangeEntry entry, _VariantColorOption? color) {
    if (color == null || widget.order.items.isEmpty) return;
    final previousKey =
        color.variantId == entry.selectedColor?.variantId
            ? entry.selectedSize?.key
            : null;
    final cached = entry.sizeOptionsByColor[color.variantId];
    final sizeOptions = cached != null
        ? List<_VariantSizeOption>.from(cached)
        : _buildSizeOptions(color, widget.order.items[entry.orderItemIndex]);
    _VariantSizeOption? newSize;
    if (previousKey != null) {
      try {
        newSize = sizeOptions.firstWhere((opt) => opt.key == previousKey);
      } catch (_) {
        newSize = sizeOptions.isNotEmpty ? sizeOptions.first : null;
      }
    } else {
      newSize = sizeOptions.isNotEmpty ? sizeOptions.first : null;
    }
    setState(() {
      entry.selectedColor = color;
      entry.sizeOptions = sizeOptions;
      entry.selectedSize = newSize;
    });
  }

  String _fileName(File file) => p.basename(file.path);

  Future<bool> _ensureMediaPermission() async {
    PermissionStatus status;

    if (Platform.isAndroid) {
      final photosGranted = await Permission.photos.isGranted;
      final storageGranted = await Permission.storage.isGranted;
      if (photosGranted || storageGranted) {
        status = PermissionStatus.granted;
      } else {
        status = await Permission.photos.request();
        if (!status.isGranted) {
          status = await Permission.storage.request();
        }
      }
    } else {
      status = await Permission.photos.request();
    }

    if (status.isGranted) return true;

    if (status.isPermanentlyDenied && mounted) {
      await showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Cần quyền truy cập'),
          content: const Text(
              'Ứng dụng cần quyền truy cập thư viện để chọn hình ảnh/video minh chứng. Vui lòng bật quyền trong cài đặt.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Đóng'),
            ),
            TextButton(
              onPressed: () {
                openAppSettings();
                Navigator.pop(ctx);
              },
              child: const Text('Mở cài đặt'),
            ),
          ],
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Cần quyền truy cập thư viện để chọn minh chứng')));
    }
    return false;
  }

  Future<bool> _validateFileSize(File file) async {
    final size = await file.length();
    if (size > _maxMediaBytes) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Dung lượng vượt quá 50MB.')),
        );
      }
      return false;
    }
    return true;
  }

  Future<void> _pickImageEvidence() async {
    if (_imageEvidence.length >= _maxImageCount) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                'Chỉ được chọn tối đa $_maxImageCount hình ảnh minh chứng.'),
          ),
        );
      }
      return;
    }
    if (!await _ensureMediaPermission()) return;
    try {
      final picked =
          await _picker.pickImage(source: ImageSource.gallery, maxWidth: 1600);
      if (picked != null && mounted) {
        final file = File(picked.path);
        if (!await _validateFileSize(file)) return;
        setState(() {
          _imageEvidence.add(file);
          _imageEvidenceUrls.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi khi chọn hình ảnh: $e')),
        );
      }
    }
  }

  Future<void> _pickVideoEvidence() async {
    if (!await _ensureMediaPermission()) return;
    try {
      final picked = await _picker.pickVideo(
        source: ImageSource.gallery,
        maxDuration: const Duration(minutes: 2),
      );
      if (picked != null && mounted) {
        final file = File(picked.path);
        if (!await _validateFileSize(file)) return;
        setState(() {
          _videoEvidence = file;
          _videoEvidenceUrl = null;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi khi chọn video: $e')),
        );
      }
    }
  }

  void _removeImageEvidenceAt(int index) {
    if (index < 0 || index >= _imageEvidence.length) return;
    setState(() {
      _imageEvidence.removeAt(index);
      if (index < _imageEvidenceUrls.length) {
        _imageEvidenceUrls.removeAt(index);
      }
    });
  }

  void _removeVideoEvidence() {
    setState(() {
      _videoEvidence = null;
      _videoEvidenceUrl = null;
    });
  }

  Future<String?> _uploadEvidenceFile(File file, {required bool isVideo}) async {
    final mimeType =
        lookupMimeType(file.path) ?? (isVideo ? 'video/mp4' : 'image/jpeg');
    final multipart = await http.MultipartFile.fromPath(
      'file',
      file.path,
      contentType: mimeType != null ? MediaType.parse(mimeType) : null,
    );
    final res = await _apiClient.postMultipart('/chat/upload', files: [multipart]);
    final url = res['url'] ?? res['data']?['url'];
    return url?.toString();
  }

  Future<bool> _ensureEvidenceUploaded() async {
    if (_imageEvidence.isEmpty && _videoEvidence == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vui lòng cung cấp ít nhất một hình ảnh hoặc video.'),
          ),
        );
      }
      return false;
    }
    try {
      setState(() => _uploadingEvidence = true);
      _imageEvidenceUrls.clear();
      for (final img in _imageEvidence) {
        final url = await _uploadEvidenceFile(img, isVideo: false);
        if (url == null) {
          throw Exception('Không thể tải hình ảnh');
        }
        _imageEvidenceUrls.add(url);
      }
      if (_videoEvidence != null) {
        _videoEvidenceUrl =
            await _uploadEvidenceFile(_videoEvidence!, isVideo: true);
        if (_videoEvidenceUrl == null) {
          throw Exception('Không thể tải video');
        }
      } else {
        _videoEvidenceUrl = null;
      }
      return _imageEvidenceUrls.length == _imageEvidence.length &&
          (_videoEvidence == null || _videoEvidenceUrl != null);
    } catch (e) {
      final message = e is ApiException ? e.message : e.toString();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể tải minh chứng: $message')),
        );
      }
      return false;
    } finally {
      if (mounted) {
        setState(() => _uploadingEvidence = false);
      }
    }
  }

  int _availableQuantityForItem(int orderItemIndex,
      {_ExchangeEntry? excluding}) {
    if (orderItemIndex < 0 || orderItemIndex >= widget.order.items.length) {
      return 0;
    }
    final item = widget.order.items[orderItemIndex];
    final used = _entries
        .where((e) => e != excluding && e.orderItemIndex == orderItemIndex)
        .fold<int>(0, (sum, e) => sum + e.quantity);
    final remaining = item.quantity - used;
    return remaining < 0 ? 0 : remaining;
  }

  int _maxQuantityForEntry(_ExchangeEntry entry) =>
      _availableQuantityForItem(entry.orderItemIndex, excluding: entry);

  void _addEntry() {
    final nextIndex = _nextAvailableItemIndex();
    if (nextIndex == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Đã sử dụng hết số lượng sản phẩm có thể đổi')));
      return;
    }
    final entry = _ExchangeEntry(orderItemIndex: nextIndex)..loading = true;
    setState(() {
      _entries.add(entry);
    });
    _loadEntryVariants(entry);
  }

  void _removeEntry(int index) {
    if (index < 0 || index >= _entries.length) return;
    setState(() {
      _entries.removeAt(index);
    });
  }

  void _changeEntryOrderItem(_ExchangeEntry entry, int? newIndex) {
    if (newIndex == null || newIndex < 0) return;
    final available = _availableQuantityForItem(newIndex, excluding: entry);
    if (available <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Sản phẩm này đã được chọn hết số lượng có thể đổi')));
      return;
    }
    setState(() {
      entry.orderItemIndex = newIndex;
      entry.quantity = 1;
      entry.colorOptions = [];
      entry.selectedColor = null;
      entry.sizeOptions = [];
      entry.selectedSize = null;
      entry.sizeOptionsByColor = {};
      entry.loading = true;
    });
    _loadEntryVariants(entry);
  }

  void _updateEntryQuantity(_ExchangeEntry entry, int delta) {
    final newValue = entry.quantity + delta;
    if (newValue < 1) return;
    final max = _maxQuantityForEntry(entry);
    if (newValue > max) return;
    setState(() {
      entry.quantity = newValue;
    });
  }

  bool get _canAddEntry => _nextAvailableItemIndex() != null;

  Widget _buildEntryCard(int entryIndex) {
    final entry = _entries[entryIndex];
    final items = widget.order.items;
    final orderItem = items[entry.orderItemIndex];
    final maxQty = _maxQuantityForEntry(entry);
    return _card(children: [
      Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: accentOcean.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.shopping_bag_outlined, 
                  color: primaryOcean, 
                  size: 20
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Sản phẩm đổi #${entryIndex + 1}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: darkOcean,
                ),
              ),
            ],
          ),
          if (_entries.length > 1)
            IconButton(
              icon: const Icon(Icons.close, size: 20),
              color: Colors.red.shade400,
              onPressed: () => _removeEntry(entryIndex),
              tooltip: 'Xóa sản phẩm này',
            ),
        ],
      ),
      const SizedBox(height: 16),
      DropdownButtonFormField<int>(
        value: entry.orderItemIndex,
        decoration: InputDecoration(
          labelText: 'Chọn sản phẩm',
          labelStyle: TextStyle(color: primaryOcean),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: lightOcean),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: lightOcean.withOpacity(0.3)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: lightOcean, width: 2),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          filled: true,
          fillColor: backgroundOcean.withOpacity(0.3),
        ),
        items: List.generate(items.length, (index) {
          final item = items[index];
          final available = _availableQuantityForItem(index, excluding: entry);
          final enabled =
              available > 0 || entry.orderItemIndex == index;
          final subtitle =
              'Đã đặt: ${item.quantity}${enabled ? '' : ' (hết số lượng)'}';
          final variantLabel = (item.variantName ?? '').trim();
          return DropdownMenuItem<int>(
            value: index,
            enabled: enabled,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.productName ?? 'Sản phẩm #${item.variantId}',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: enabled ? darkOcean : Colors.grey,
                  ),
                ),
                if (variantLabel.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    variantLabel,
                    style: TextStyle(
                      fontSize: 12,
                      color: enabled ? Colors.grey[700] : Colors.grey,
                    ),
                  ),
                ],
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: enabled ? Colors.grey[600] : Colors.redAccent,
                  ),
                ),
              ],
            ),
          );
        }),
        onChanged: (v) => _changeEntryOrderItem(entry, v),
      ),
      const SizedBox(height: 16),
      Row(
        children: [
          Container(
            decoration: BoxDecoration(
              color: backgroundOcean,
              border: Border.all(color: lightOcean, width: 2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                IconButton(
                  onPressed:
                      entry.quantity > 1 ? () => _updateEntryQuantity(entry, -1) : null,
                  icon: const Icon(Icons.remove_circle),
                  color: entry.quantity > 1 ? lightOcean : Colors.grey.shade400,
                ),
                Container(
                  constraints: const BoxConstraints(minWidth: 50),
                  alignment: Alignment.center,
                  child: Text(
                    '${entry.quantity}',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: primaryOcean,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: entry.quantity < maxQty
                      ? () => _updateEntryQuantity(entry, 1)
                      : null,
                  icon: const Icon(Icons.add_circle),
                  color: entry.quantity < maxQty ? lightOcean : Colors.grey.shade400,
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: accentOcean.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Tối đa: $maxQty',
              style: TextStyle(
                color: darkOcean,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      const SizedBox(height: 16),
      if (entry.loading)
        LinearProgressIndicator(
          backgroundColor: backgroundOcean,
          valueColor: AlwaysStoppedAnimation<Color>(lightOcean),
        )
      else ...[
        if (entry.error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              entry.error!,
              style: const TextStyle(color: Colors.red),
            ),
          ),
        Text(
          'Chọn màu sắc',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            color: darkOcean,
          ),
        ),
        const SizedBox(height: 10),
        if (entry.colorOptions.isEmpty)
          Text(
            'Không có biến thể khả dụng',
            style: TextStyle(color: Colors.grey[600]),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: backgroundOcean.withOpacity(0.3),
              border: Border.all(color: lightOcean.withOpacity(0.3)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonFormField<_VariantColorOption>(
              value: entry.selectedColor,
              decoration: const InputDecoration(
                border: InputBorder.none,
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              items: entry.colorOptions
                  .map(
                    (opt) => DropdownMenuItem(
                      value: opt,
                      child: Text(
                        opt.label,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: darkOcean,
                        ),
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (v) => _onEntryColorChanged(entry, v),
            ),
          ),
        const SizedBox(height: 16),
        Text(
          'Chọn kích thước',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            color: darkOcean,
          ),
        ),
        const SizedBox(height: 10),
        if (entry.selectedColor == null)
          Text(
            'Chọn màu trước để hiển thị size',
            style: TextStyle(color: Colors.grey[600]),
          )
        else if (entry.sizeOptions.isEmpty)
          Text(
            'Không có size khả dụng cho màu này',
            style: TextStyle(color: Colors.red[400]),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: backgroundOcean.withOpacity(0.3),
              border: Border.all(color: lightOcean.withOpacity(0.3)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonFormField<_VariantSizeOption>(
              value: entry.selectedSize,
              decoration: const InputDecoration(
                border: InputBorder.none,
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              items: entry.sizeOptions
                  .map(
                    (opt) => DropdownMenuItem(
                      value: opt,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            opt.label,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: darkOcean,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            opt.detail,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (v) =>
                  setState(() => entry.selectedSize = v),
            ),
          ),
      ],
    ]);
  }

  Widget _buildEvidenceCard() {
    return _card(children: [
      Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: accentOcean.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.camera_alt,
              color: primaryOcean,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          const Text(
            'Minh chứng (ảnh/video)',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: darkOcean,
            ),
          ),
          const SizedBox(width: 4),
          const Text('*', style: TextStyle(color: Colors.red, fontSize: 16)),
        ],
      ),
      const SizedBox(height: 8),
      Text(
        'Tối đa 5 ảnh và 1 video, mỗi tệp ≤ 50MB. Vui lòng cung cấp ít nhất một minh chứng để hỗ trợ duyệt nhanh hơn.',
        style: TextStyle(fontSize: 13, color: Colors.grey[600], height: 1.4),
      ),
      const SizedBox(height: 14),
      if (_imageEvidence.isNotEmpty)
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: List.generate(_imageEvidence.length, (index) {
            final file = _imageEvidence[index];
            return Stack(
              clipBehavior: Clip.none,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.file(
                    file,
                    width: 90,
                    height: 90,
                    fit: BoxFit.cover,
                  ),
                ),
                Positioned(
                  top: -6,
                  right: -6,
                  child: GestureDetector(
                    onTap: () => _removeImageEvidenceAt(index),
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
                  'Chưa có hình ảnh minh chứng nào.',
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
              onPressed: _pickImageEvidence,
              icon: const Icon(Icons.photo_library_outlined),
              label: Text('Thêm ảnh (${_imageEvidence.length}/$_maxImageCount)'),
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
              onPressed: _pickVideoEvidence,
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
      if (_uploadingEvidence)
        Padding(
          padding: const EdgeInsets.only(top: 16),
          child: LinearProgressIndicator(
            backgroundColor: backgroundOcean,
            valueColor: AlwaysStoppedAnimation<Color>(lightOcean),
        ),
      ),
    ]);
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
                  overflow: TextOverflow.ellipsis,
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
            onPressed: _removeVideoEvidence,
            icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
          ),
        ],
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    final items = widget.order.items;
    return Scaffold(
      backgroundColor: backgroundOcean,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Tạo yêu cầu đổi hàng',
          style: TextStyle(
            color: Colors.white,
            fontSize: 19,
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: primaryOcean,
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [primaryOcean, lightOcean],
            ),
          ),
        ),
      ),
      body: items.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox_outlined, size: 80, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    'Không có sản phẩm trong đơn',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Order info
                    _card(children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: accentOcean.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              Icons.receipt_long_outlined,
                              color: primaryOcean,
                              size: 24,
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
                                  color: Colors.grey,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '#${widget.order.id}',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: darkOcean,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ]),
                    const SizedBox(height: 16),

                    // Exchange entries
                    if (_entries.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(
                            'Không có sản phẩm nào đủ điều kiện đổi.',
                            style: TextStyle(
                              fontSize: 15,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ),
                      )
                    else
                      ..._entries
                          .asMap()
                          .entries
                          .map((e) => Padding(
                                padding: EdgeInsets.only(
                                    bottom: e.key == _entries.length - 1
                                        ? 0
                                        : 16),
                                child: _buildEntryCard(e.key),
                              )),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _canAddEntry ? _addEntry : null,
                        icon: const Icon(Icons.add_circle_outline, size: 20),
                        label: const Text('Thêm sản phẩm đổi'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: lightOcean,
                          side: BorderSide(
                            color: _canAddEntry ? lightOcean : Colors.grey.shade300,
                            width: 2,
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildEvidenceCard(),
                    const SizedBox(height: 16),

                    // Reason
                    _card(children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: accentOcean.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(Icons.edit_note, 
                              color: primaryOcean, 
                              size: 20
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'Lý do đổi',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: darkOcean,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            '*',
                            style: TextStyle(color: Colors.red, fontSize: 16),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _reasonCtrl,
                        maxLines: 4,
                        decoration: InputDecoration(
                          hintText:
                              'Mô tả lý do đổi hàng (VD: Muốn đổi size, màu sắc...)',
                          hintStyle: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 14,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: lightOcean.withOpacity(0.3)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: lightOcean.withOpacity(0.3)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                BorderSide(color: lightOcean, width: 2),
                          ),
                          filled: true,
                          fillColor: backgroundOcean.withOpacity(0.3),
                          contentPadding: const EdgeInsets.all(16),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 28),

                    // Submit button
                    Container(
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
                                  color: lightOcean.withOpacity(0.4),
                                  blurRadius: 12,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                      ),
                      child: ElevatedButton(
                        onPressed: _submitting ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
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
                                  Icon(Icons.send, size: 20),
                                  SizedBox(width: 10),
                                  Text(
                                    'Gửi yêu cầu',
                                    style: TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ]),
            ),
    );
  }

  Widget _card({required List<Widget> children}) => Container(
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
            crossAxisAlignment: CrossAxisAlignment.start, children: children),
      );

  Future<void> _submit() async {
    if (widget.order.items.isEmpty) return;
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.user == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Vui lòng đăng nhập')));
      return;
    }
    final reason = _reasonCtrl.text.trim();
    if (reason.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Nhập lý do')));
      return;
    }
    if (_entries.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không có sản phẩm để đổi')));
      return;
    }
    if (_imageEvidence.isEmpty && _videoEvidence == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content:
              Text('Vui lòng cung cấp ít nhất một hình ảnh hoặc video minh chứng')));
      return;
    }
    for (final entry in _entries) {
      if (entry.selectedSize == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content:
                Text('Vui lòng chọn màu và size cho tất cả sản phẩm đổi')));
        return;
      }
    }

    setState(() => _submitting = true);
    final attachmentsReady = await _ensureEvidenceUploaded();
    if (!attachmentsReady) {
      setState(() => _submitting = false);
      return;
    }
    final evidencePayload = jsonEncode({
      'imageEvidence': _imageEvidenceUrls,
      'videoEvidence': _videoEvidenceUrl,
    });

    final itemsPayload = _entries.map((entry) {
      final orderItem = widget.order.items[entry.orderItemIndex];
      final selectedColor = entry.selectedColor;
      final selectedSize = entry.selectedSize!;
      return {
        'machitietsanphamcu': orderItem.variantId,
        'machitietsanphammoi':
            selectedColor != null ? selectedColor.variantId : selectedSize.variantId,
        'soluong': entry.quantity,
        'hinhanh': evidencePayload,
      };
    }).toList();

    final payload = {
      'madonhang': widget.order.id,
      'makhachhang': auth.user!.maKhachHang,
      'lydo': reason,
      'items': itemsPayload,
    };

    final res = await doiHangService.createExchange(payload);
    setState(() => _submitting = false);
    if (res != null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã gửi yêu cầu đổi hàng thành công')));
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content:
              Text(doiHangService.lastError ?? 'Lỗi gửi yêu cầu đổi hàng')));
    }
  }

}

class _ExchangeEntry {
  int orderItemIndex;
  int quantity;
  bool loading;
  String? error;
  List<_VariantColorOption> colorOptions;
  _VariantColorOption? selectedColor;
  List<_VariantSizeOption> sizeOptions;
  _VariantSizeOption? selectedSize;
  Map<int, List<_VariantSizeOption>> sizeOptionsByColor;

  _ExchangeEntry({required this.orderItemIndex})
      : quantity = 1,
        loading = false,
        colorOptions = const [],
        sizeOptions = const [],
        sizeOptionsByColor = {};
}

class _VariantColorOption {
  final ProductVariant variant;

  _VariantColorOption({required this.variant});

  int get variantId => variant.id;

  String get label {
    final color = variant.color?.trim();
    if (color != null && color.isNotEmpty) return color;
    final material = variant.material?.trim();
    if (material != null && material.isNotEmpty) return material;
    return 'Biến thể #$variantId';
  }
}

class _VariantSizeOption {
  final ProductVariant variant;
  final VariantSize? size;

  _VariantSizeOption({required this.variant, this.size});

  int get variantId => variant.id;
  int? get sizeBridgeId => size?.id;
  int get stock => size?.stock ?? variant.stock;
  String get key => '${variantId}_${sizeBridgeId ?? 0}';

  String get detail {
    final qty = stock < 0 ? 0 : stock;
    return 'Còn $qty sản phẩm';
  }

  String get label {
    final name = size?.name?.trim();
    if (name != null && name.isNotEmpty) return 'Size $name';
    final fallback = variant.size?.trim();
    if (fallback != null && fallback.isNotEmpty) return 'Size $fallback';
    return 'Mặc định';
  }
}
