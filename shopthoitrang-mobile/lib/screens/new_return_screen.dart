import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/trahang_service.dart';

class NewReturnScreen extends StatefulWidget {
  final int maDonHang;
  final int maKhachHang;
  final DateTime ngayGiao;
  final List<Map<String, dynamic>> items; // {machitietsanpham, tensp, soluong}
  const NewReturnScreen(
      {super.key,
      required this.maDonHang,
      required this.maKhachHang,
      required this.ngayGiao,
      required this.items});

  @override
  State<NewReturnScreen> createState() => _NewReturnScreenState();
}

class _NewReturnScreenState extends State<NewReturnScreen> {
  Map<String, dynamic>? _selectedItem;
  int _qty = 1;
  String _reason = '';
  String? _reasonOther;
  String? _imageBase64;
  bool _submitting = false;

  final _reasons = const [
    'Sai kích thước',
    'Lỗi chất lượng',
    'Không vừa ý',
    'Khác'
  ];

  bool get _eligibleWindow {
    final diff = DateTime.now().difference(widget.ngayGiao).inDays;
    return diff >= 0 && diff <= 7;
  }

  bool get _valid {
    if (!_eligibleWindow) return false;
    if (_selectedItem == null) return false;
    if (_qty < 1 || _qty > (_selectedItem!['soluong'] as int)) return false;
    if (_reason.isEmpty) return false;
    if (_reason == 'Khác' &&
        (_reasonOther == null || _reasonOther!.trim().isEmpty)) return false;
    return true;
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file =
        await picker.pickImage(source: ImageSource.gallery, maxWidth: 1280);
    if (file != null) {
      final bytes = await file.readAsBytes();
      setState(() {
        _imageBase64 = 'data:image/${file.path.split('.').last};base64,' +
            base64Encode(bytes);
      });
    }
  }

  Future<void> _submit() async {
    if (!_valid) return;
    setState(() => _submitting = true);
    final payload = {
      'madonhang': widget.maDonHang,
      'makhachhang': widget.maKhachHang,
      'machitietsanpham':
          _selectedItem!['machitietsanpham'] ?? _selectedItem!['variantId'],
      'soluong': _qty,
      'lydo': _reason == 'Khác' ? _reasonOther : _reason,
      'hinhanhloi': _imageBase64,
    };
    final res = await trahangService.createReturn(payload);
    setState(() => _submitting = false);
    if (res != null && mounted) {
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(trahangService.lastError ?? 'Không thể tạo yêu cầu')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tạo yêu cầu trả hàng')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            if (!_eligibleWindow)
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text('Đơn đã quá hạn 7 ngày kể từ ngày giao',
                    style: TextStyle(color: Colors.red)),
              ),
            DropdownButtonFormField<Map<String, dynamic>>(
              value: _selectedItem,
              items: widget.items
                  .map((e) => DropdownMenuItem(
                      value: e,
                      child:
                          Text(e['tensp'] ?? 'SP #${e['machitietsanpham']}')))
                  .toList(),
              onChanged: (v) {
                setState(() {
                  _selectedItem = v;
                  _qty = 1;
                });
              },
              decoration: const InputDecoration(
                  labelText: 'Sản phẩm', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            Row(children: [
              const Text('Số lượng:'),
              const SizedBox(width: 8),
              IconButton(
                  onPressed: _qty > 1 ? () => setState(() => _qty--) : null,
                  icon: const Icon(Icons.remove_circle_outline)),
              Text('$_qty'),
              IconButton(
                  onPressed: (_selectedItem != null &&
                          _qty < (_selectedItem!['soluong'] as int))
                      ? () => setState(() => _qty++)
                      : null,
                  icon: const Icon(Icons.add_circle_outline)),
            ]),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _reason.isEmpty ? null : _reason,
              items: _reasons
                  .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                  .toList(),
              onChanged: (v) => setState(() => _reason = v ?? ''),
              decoration: const InputDecoration(
                  labelText: 'Lý do', border: OutlineInputBorder()),
            ),
            if (_reason == 'Khác') ...[
              const SizedBox(height: 12),
              TextFormField(
                onChanged: (v) => _reasonOther = v,
                decoration: const InputDecoration(
                    labelText: 'Mô tả lý do', border: OutlineInputBorder()),
                maxLines: 3,
              )
            ],
            const SizedBox(height: 12),
            Row(children: [
              ElevatedButton.icon(
                  onPressed: _pickImage,
                  icon: const Icon(Icons.photo),
                  label: Text(_imageBase64 == null ? 'Thêm ảnh' : 'Đổi ảnh')),
              const SizedBox(width: 12),
              if (_imageBase64 != null)
                const Icon(Icons.check_circle, color: Colors.green)
            ]),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _submitting ? null : (_valid ? _submit : null),
              child: _submitting
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('Gửi yêu cầu'),
            ),
          ],
        ),
      ),
    );
  }
}
