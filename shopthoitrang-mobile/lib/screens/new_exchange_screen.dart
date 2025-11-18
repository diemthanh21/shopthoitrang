import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/doihang_service.dart';

class NewExchangeScreen extends StatefulWidget {
  final int maDonHang;
  final int maKhachHang;
  final DateTime ngayGiao;
  final List<Map<String, dynamic>>
      items; // from order items: {machitietsanphamcu, tensp, soluong}
  const NewExchangeScreen(
      {super.key,
      required this.maDonHang,
      required this.maKhachHang,
      required this.ngayGiao,
      required this.items});

  @override
  State<NewExchangeScreen> createState() => _NewExchangeScreenState();
}

class _NewExchangeScreenState extends State<NewExchangeScreen> {
  Map<String, dynamic>? _selectedOld;
  String? _newVariantId; // simple input; ideally open product/variant picker
  int _qty = 1;
  String _reason = '';
  String? _reasonOther;
  String? _imageBase64;
  bool _submitting = false;

  final _reasons = const ['Sai kích thước', 'Muốn đổi mẫu/size', 'Khác'];

  bool get _eligibleWindow {
    final diff = DateTime.now().difference(widget.ngayGiao).inDays;
    return diff >= 0 && diff <= 7;
  }

  bool get _valid {
    if (!_eligibleWindow) return false;
    if (_selectedOld == null) return false;
    if (_qty < 1 || _qty > (_selectedOld!['soluong'] as int)) return false;
    if ((_newVariantId == null) || _newVariantId!.trim().isEmpty) return false;
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
      'machitietsanphamcu':
          _selectedOld!['machitietsanphamcu'] ?? _selectedOld!['variantId'],
      'machitietsanphammoi':
          int.tryParse(_newVariantId!.trim()) ?? _newVariantId,
      'soluong': _qty,
      'lydo': _reason == 'Khác' ? _reasonOther : _reason,
      'hinhanhloi': _imageBase64,
    };
    final res = await doiHangService.createExchange(payload);
    setState(() => _submitting = false);
    if (res != null && mounted) {
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(
              doiHangService.lastError ?? 'Không thể tạo yêu cầu đổi hàng')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tạo yêu cầu đổi hàng')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(children: [
          if (!_eligibleWindow)
            const Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: Text('Đơn đã quá hạn 7 ngày kể từ ngày giao',
                  style: TextStyle(color: Colors.red)),
            ),
          DropdownButtonFormField<Map<String, dynamic>>(
            value: _selectedOld,
            items: widget.items
                .map((e) => DropdownMenuItem(
                    value: e,
                    child:
                        Text(e['tensp'] ?? 'SP #${e['machitietsanphamcu']}')))
                .toList(),
            onChanged: (v) {
              setState(() {
                _selectedOld = v;
                _qty = 1;
              });
            },
            decoration: const InputDecoration(
                labelText: 'Sản phẩm muốn đổi (hàng cũ)',
                border: OutlineInputBorder()),
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
                onPressed: (_selectedOld != null &&
                        _qty < (_selectedOld!['soluong'] as int))
                    ? () => setState(() => _qty++)
                    : null,
                icon: const Icon(Icons.add_circle_outline)),
          ]),
          const SizedBox(height: 12),
          TextFormField(
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
                labelText: 'Mã chi tiết SP muốn đổi (variant id mới)',
                border: OutlineInputBorder()),
            onChanged: (v) => _newVariantId = v,
          ),
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
        ]),
      ),
    );
  }
}
