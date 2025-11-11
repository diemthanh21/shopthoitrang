import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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
  int _selectedOldIndex = 0;
  int _quantity = 1;
  final _reasonCtrl = TextEditingController();
  bool _submitting = false;
  final ProductService _productService = ProductService(ApiClient());
  List<ProductVariant> _availableNewVariants = [];
  int? _selectedNewVariantId;

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    // Load variants for initial selected item
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAvailableVariants();
    });
  }

  Future<void> _loadAvailableVariants() async {
    final items = widget.order.items;
    if (items.isEmpty) return;
    final old = items[_selectedOldIndex];

    try {
      // Try to use productId if available
      List<ProductVariant> variants = [];
      if (old.productId != null) {
        final prod = await _productService.getByIdWithImages(old.productId!);
        if (prod != null) variants = prod.variants;
      } else {
        final pwv = await _productService
            .getProductWithVariantByVariantId(old.variantId);
        if (pwv != null) variants = pwv.product.variants;
      }

      // Exclude the old variant itself
      final avail = variants.where((v) => v.id != old.variantId).toList();
      setState(() {
        _availableNewVariants = avail;
        _selectedNewVariantId = avail.isNotEmpty ? avail.first.id : null;
      });
    } catch (e) {
      debugPrint('Error loading available variants: $e');
      setState(() {
        _availableNewVariants = [];
        _selectedNewVariantId = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.order.items;
    final selectedOld = items.isNotEmpty ? items[_selectedOldIndex] : null;
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Tạo yêu cầu đổi hàng',
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
          ? const Center(child: Text('Không có sản phẩm trong đơn'))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Order info
                    _card(children: [
                      Row(
                        children: [
                          Icon(Icons.receipt_outlined,
                              color: Colors.blue.shade700, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Đơn hàng #${widget.order.id}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ]),
                    const SizedBox(height: 12),

                    // Old product selection
                    _card(children: [
                      Row(
                        children: [
                          const Text(
                            'Chọn sản phẩm cũ',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            '*',
                            style: TextStyle(color: Colors.red, fontSize: 15),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey.shade300),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: DropdownButtonFormField<int>(
                          value: _selectedOldIndex,
                          decoration: const InputDecoration(
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                          ),
                          items: List.generate(
                            items.length,
                            (i) => DropdownMenuItem(
                              value: i,
                              child: Text(
                                items[i].productName ??
                                    'SP #${items[i].variantId}',
                                style: const TextStyle(fontSize: 14),
                              ),
                            ),
                          ),
                          onChanged: (v) {
                            setState(() {
                              _selectedOldIndex = v ?? 0;
                              _quantity = 1;
                            });
                            _loadAvailableVariants();
                          },
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.blue),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                IconButton(
                                  onPressed: _quantity > 1
                                      ? () => setState(() => _quantity--)
                                      : null,
                                  icon: const Icon(Icons.remove_circle_outline),
                                  color:
                                      _quantity > 1 ? Colors.blue : Colors.grey,
                                ),
                                Container(
                                  constraints:
                                      const BoxConstraints(minWidth: 40),
                                  alignment: Alignment.center,
                                  child: Text(
                                    '$_quantity',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  onPressed: selectedOld != null &&
                                          _quantity < selectedOld.quantity
                                      ? () => setState(() => _quantity++)
                                      : null,
                                  icon: const Icon(Icons.add_circle_outline),
                                  color: selectedOld != null &&
                                          _quantity < selectedOld.quantity
                                      ? Colors.blue
                                      : Colors.grey,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            '(Tối đa: ${selectedOld?.quantity ?? 0})',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ]),
                    const SizedBox(height: 12),

                    // New variant (must be same product)
                    _card(children: [
                      Row(
                        children: [
                          const Text(
                            'Chọn biến thể mới',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            '*',
                            style: TextStyle(color: Colors.red, fontSize: 15),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (_availableNewVariants.isEmpty)
                        Text(
                          'Không có biến thể thay thế cho sản phẩm này',
                          style: TextStyle(color: Colors.grey[600]),
                        )
                      else
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: DropdownButtonFormField<int>(
                            value: _selectedNewVariantId,
                            decoration: const InputDecoration(
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                            ),
                            items: _availableNewVariants
                                .map((v) => DropdownMenuItem(
                                      value: v.id,
                                      child: Text(v.displayName),
                                    ))
                                .toList(),
                            onChanged: (v) => setState(() {
                              _selectedNewVariantId = v;
                            }),
                          ),
                        ),
                    ]),
                    const SizedBox(height: 12),

                    // Reason
                    _card(children: [
                      Row(
                        children: [
                          const Text(
                            'Lý do đổi',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            '*',
                            style: TextStyle(color: Colors.red, fontSize: 15),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _reasonCtrl,
                        maxLines: 4,
                        decoration: InputDecoration(
                          hintText:
                              'Mô tả lý do đổi hàng (VD: Muốn đổi size, màu sắc...)',
                          hintStyle: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 13,
                          ),
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
                            borderSide:
                                const BorderSide(color: Colors.blue, width: 2),
                          ),
                          contentPadding: const EdgeInsets.all(12),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 24),

                    // Submit button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _submitting ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 2,
                        ),
                        child: _submitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
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
                  ]),
            ),
    );
  }

  Widget _card({required List<Widget> children}) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
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
    if (_selectedNewVariantId == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Chọn biến thể mới')));
      return;
    }
    final newVariantId = _selectedNewVariantId!;

    setState(() => _submitting = true);
    final oldItem = widget.order.items[_selectedOldIndex];
    final payload = {
      'madonhang': widget.order.id,
      'makhachhang': auth.user!.maKhachHang,
      'machitietsanphamcu': oldItem.variantId,
      'machitietsanphammoi': newVariantId,
      'soluong': _quantity,
      'lydo': reason,
    };
    final res = await doiHangService.createExchange(payload);
    setState(() => _submitting = false);
    if (res != null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã gửi yêu cầu đổi hàng')));
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(doiHangService.lastError ?? 'Lỗi gửi yêu cầu')));
    }
  }
}
