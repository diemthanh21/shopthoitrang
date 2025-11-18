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
  final DateFormat _dateFormatter = DateFormat('dd/MM/yyyy');

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
    final activeCoupons = coupons.where((c) => c.isActive).toList();
    setState(() {
      _discountCoupons =
          activeCoupons.where((c) => c.discountType != 'FREESHIP').toList();
      _freeshipCoupons =
          activeCoupons.where((c) => c.discountType == 'FREESHIP').toList();
      _isLoading = false;
    });
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  bool _isApplicable(Coupon coupon) => coupon.canApplyTo(widget.subtotal);

  DateTime get _todayDateOnly {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
  }

  String? _ineligibleReason(Coupon coupon) {
    final today = _todayDateOnly;
    if (!coupon.hasQuantity && coupon.totalQuantity > 0) {
      return 'Mã đã hết lượt sử dụng';
    }
    final startDate = coupon.startDateOnly;
    if (startDate != null && today.isBefore(startDate)) {
      return 'Áp dụng từ ${_formatDate(startDate)}';
    }
    final endDate = coupon.endDateOnly;
    if (endDate != null && today.isAfter(endDate)) {
      return 'Mã đã hết hạn';
    }
    if (coupon.minOrderValue != null && widget.subtotal < coupon.minOrderValue!) {
      final missing = coupon.minOrderValue! - widget.subtotal;
      return 'Mua thêm ${_formatCurrency(missing)} để áp dụng mã này';
    }
    return null;
  }

  String? _conditionDescription(Coupon coupon) {
    final note = coupon.conditionNote?.trim();
    if (note != null && note.isNotEmpty) return note;
    final desc = coupon.description?.trim();
    if (desc != null && desc.isNotEmpty) return desc;
    return null;
  }

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
    final reason = applicable ? null : _ineligibleReason(coupon);
    final subtitle = _couponValueLabel(coupon);
    final condition = _conditionDescription(coupon);
    final displayName = (coupon.name?.trim().isNotEmpty ?? false)
        ? coupon.name!.trim()
        : coupon.code;
    final validity = _validityInfo(coupon);
    final timeStatus = _timeStatusLabel(coupon);
    final usageInfo = _usageInfo(coupon);
    final endCondition = _endConditionInfo(coupon);

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
                          displayName,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      if (selected)
                        const Icon(Icons.check_circle, color: Colors.blue),
                    ],
                  ),
                  if (displayName.toUpperCase() != coupon.code.toUpperCase())
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Mã: ${coupon.code}',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[800],
                          ),
                        ),
                      ),
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
                  if (validity != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.access_time,
                              size: 16, color: Colors.grey[600]),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              validity,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[700],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (timeStatus != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        timeStatus,
                        style: TextStyle(
                          fontSize: 12,
                          color:
                              applicable ? Colors.orange[700] : Colors.red[400],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  if (usageInfo != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        usageInfo,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[700],
                        ),
                      ),
                    ),
                  if (endCondition != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        endCondition,
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                    ),
                  if (condition != null && condition.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Điều kiện áp dụng',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            condition,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  if (!applicable && reason != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        reason,
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

  String? _validityInfo(Coupon coupon) {
    final start = coupon.startDateOnly;
    final end = coupon.endDateOnly;
    if (start == null && end == null) return null;
    if (start != null && end != null) {
      return 'Hiệu lực ${_formatDate(start)} - ${_formatDate(end)}';
    }
    if (start != null) {
      return 'Hiệu lực từ ${_formatDate(start)}';
    }
    return 'Hiệu lực đến ${_formatDate(end!)}';
  }

  String? _timeStatusLabel(Coupon coupon) {
    final end = coupon.endDateOnly;
    if (end == null) return null;
    final today = _todayDateOnly;
    final days = end.difference(today).inDays;
    if (days < 0) return 'Mã đã hết hạn';
    if (days == 0) return 'Hết hạn trong hôm nay';
    if (days == 1) return 'Còn 1 ngày';
    return 'Còn $days ngày';
  }

  String? _usageInfo(Coupon coupon) {
    if (coupon.totalQuantity <= 0) return null;
    final remaining = coupon.remainingQuantity;
    
  }

  String? _endConditionInfo(Coupon coupon) {
    final hasQuota = coupon.totalQuantity > 0;
    final end = coupon.endDateOnly;
    if (!hasQuota && end == null) return null;
    final segments = <String>[];
    if (end != null) {
      segments.add('hết hạn (${_formatDate(end)})');
    }
   
  }

  String _formatCurrency(double value) {
    return _currencyFormatter.format(value);
  }

  String _formatDate(DateTime value) {
    return _dateFormatter.format(value);
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
