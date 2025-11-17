import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/coupon_model.dart';
import '../services/coupon_service.dart';

class CouponSelectionScreen extends StatefulWidget {
  final double subtotal;
  final double shippingFee;
  final Coupon? initialDiscountCoupon;
  final Coupon? initialFreeshipCoupon;

  const CouponSelectionScreen({
    super.key,
    required this.subtotal,
    required this.shippingFee,
    this.initialDiscountCoupon,
    this.initialFreeshipCoupon,
  });

  @override
  State<CouponSelectionScreen> createState() => _CouponSelectionScreenState();
}

class _CouponSelectionScreenState extends State<CouponSelectionScreen> {
  final CouponService _couponService = CouponService();
  final TextEditingController _codeController = TextEditingController();
  final NumberFormat _currencyFormatter =
      NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);

  bool _isLoading = true;
  List<Coupon> _discountCoupons = [];
  List<Coupon> _freeshipCoupons = [];
  Coupon? _selectedDiscountCoupon;
  Coupon? _selectedFreeshipCoupon;

  @override
  void initState() {
    super.initState();
    _selectedDiscountCoupon = widget.initialDiscountCoupon;
    _selectedFreeshipCoupon = widget.initialFreeshipCoupon;
    _loadCoupons();
  }

  Future<void> _loadCoupons() async {
    setState(() => _isLoading = true);
    final coupons = await _couponService.getCoupons(onlyActive: true);
    if (!mounted) return;
    setState(() {
      _discountCoupons =
          coupons.where((c) => c.discountType != 'FREESHIP').toList();
      _freeshipCoupons =
          coupons.where((c) => c.discountType == 'FREESHIP').toList();
      _isLoading = false;
    });
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  bool _isApplicable(Coupon coupon) => coupon.canApplyTo(widget.subtotal);

  void _toggleDiscount(Coupon coupon) {
    if (!_isApplicable(coupon)) return;
    setState(() {
      if (_selectedDiscountCoupon?.code == coupon.code) {
        _selectedDiscountCoupon = null;
      } else {
        _selectedDiscountCoupon = coupon;
      }
    });
  }

  void _toggleFreeship(Coupon coupon) {
    if (!_isApplicable(coupon)) return;
    setState(() {
      if (_selectedFreeshipCoupon?.code == coupon.code) {
        _selectedFreeshipCoupon = null;
      } else {
        _selectedFreeshipCoupon = coupon;
      }
    });
  }

  void _applyManualCode() {
    final input = _codeController.text.trim().toUpperCase();
    if (input.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập mã cần áp dụng')),
      );
      return;
    }

    Coupon? coupon;
    for (final c in [..._discountCoupons, ..._freeshipCoupons]) {
      if (c.code.toUpperCase() == input) {
        coupon = c;
        break;
      }
    }

    if (coupon == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không tìm thấy mã $input')),
      );
      return;
    }

    final matchedCoupon = coupon!;

    if (!_isApplicable(matchedCoupon)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đơn hàng chưa đủ điều kiện để áp dụng mã này'),
        ),
      );
      return;
    }

    setState(() {
      if (matchedCoupon.discountType == 'FREESHIP') {
        _selectedFreeshipCoupon = matchedCoupon;
      } else {
        _selectedDiscountCoupon = matchedCoupon;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Đã chọn mã ${matchedCoupon.code}')),
    );
  }

  void _clearSelections() {
    setState(() {
      _selectedDiscountCoupon = null;
      _selectedFreeshipCoupon = null;
    });
  }

  void _submit() {
    Navigator.pop(
      context,
      CouponSelectionResult(
        discountCoupon: _selectedDiscountCoupon,
        freeshipCoupon: _selectedFreeshipCoupon,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chọn mã giảm giá'),
        centerTitle: true,
        actions: [
          if (_selectedDiscountCoupon != null ||
              _selectedFreeshipCoupon != null)
            TextButton(
              onPressed: _clearSelections,
              child: const Text(
                'Bỏ chọn',
                style: TextStyle(color: Colors.white),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildManualInput(),
                const SizedBox(height: 20),
                _buildSectionHeader('Mã freeship (chọn tối đa 1)'),
                const SizedBox(height: 8),
                if (_freeshipCoupons.isEmpty)
                  const Text(
                    'Không có mã freeship khả dụng',
                    style: TextStyle(color: Colors.grey),
                  )
                else
                  ..._freeshipCoupons.map(
                    (coupon) => _buildCouponTile(
                      coupon: coupon,
                      selected: _selectedFreeshipCoupon?.code == coupon.code,
                      onTap: () => _toggleFreeship(coupon),
                    ),
                  ),
                const SizedBox(height: 24),
                _buildSectionHeader('Mã giảm giá khác (chọn tối đa 1)'),
                const SizedBox(height: 8),
                if (_discountCoupons.isEmpty)
                  const Text(
                    'Không có mã giảm giá khả dụng',
                    style: TextStyle(color: Colors.grey),
                  )
                else
                  ..._discountCoupons.map(
                    (coupon) => _buildCouponTile(
                      coupon: coupon,
                      selected: _selectedDiscountCoupon?.code == coupon.code,
                      onTap: () => _toggleDiscount(coupon),
                    ),
                  ),
              ],
            ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton(
            onPressed: _submit,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Áp dụng',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildManualInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Nhập mã giảm giá',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _codeController,
                decoration: InputDecoration(
                  hintText: 'Nhập mã...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                ),
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: _applyManualCode,
              style: ElevatedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Áp dụng'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildCouponTile({
    required Coupon coupon,
    required bool selected,
    required VoidCallback onTap,
  }) {
    final applicable = _isApplicable(coupon);
    final subtitle = _couponValueLabel(coupon);
    return GestureDetector(
      onTap: applicable ? onTap : null,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? Colors.blue : Colors.grey[300]!,
            width: selected ? 1.5 : 1,
          ),
          color: selected ? Colors.blue.withOpacity(0.05) : Colors.white,
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          coupon.code,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      if (selected)
                        const Icon(Icons.check_circle, color: Colors.blue),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.black87,
                    ),
                  ),
                  if (coupon.minOrderValue != null &&
                      coupon.minOrderValue! > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        'Đơn tối thiểu ${_formatCurrency(coupon.minOrderValue!)}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ),
                  if (!applicable)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'Chưa đủ điều kiện áp dụng',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.red[400],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _couponValueLabel(Coupon coupon) {
    switch (coupon.discountType) {
      case 'PERCENT':
        final percent = coupon.percent?.toStringAsFixed(0) ?? '0';
        if (coupon.maxDiscountAmount != null &&
            coupon.maxDiscountAmount! > 0) {
          return 'Giảm $percent% (tối đa ${_formatCurrency(coupon.maxDiscountAmount!)})';
        }
        return 'Giảm $percent%';
      case 'FREESHIP':
        if (coupon.maxDiscountAmount != null &&
            coupon.maxDiscountAmount! > 0) {
          return 'Freeship đến ${_formatCurrency(coupon.maxDiscountAmount!)}';
        }
        return 'Freeship toàn đơn';
      default:
        return 'Giảm ${_formatCurrency(coupon.fixedAmount ?? 0)}';
    }
  }

  String _formatCurrency(double value) {
    return _currencyFormatter.format(value);
  }
}

class CouponSelectionResult {
  final Coupon? discountCoupon;
  final Coupon? freeshipCoupon;

  const CouponSelectionResult({
    this.discountCoupon,
    this.freeshipCoupon,
  });
}
