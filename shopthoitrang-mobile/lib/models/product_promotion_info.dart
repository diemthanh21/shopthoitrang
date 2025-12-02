import '../utils/datetime_utils.dart';

class ProductPromotionInfo {
  final int promoId;
  final String programName;
  final String label;
  final String? description;
  final String? voucherCode;
  final DateTime? startAt;
  final DateTime? endAt;
  final double? percent;
  final double? amountOff;

  const ProductPromotionInfo({
    required this.promoId,
    required this.programName,
    required this.label,
    this.description,
    this.voucherCode,
    this.startAt,
    this.endAt,
    this.percent,
    this.amountOff,
  });

  factory ProductPromotionInfo.fromJson(Map<String, dynamic> json) {
    double? percent;
    final rawPercent =
        json['tylegiam'] ?? json['tyleGiam'] ?? json['percent'] ?? json['phanTram'];
    if (rawPercent != null) {
      percent = double.tryParse(rawPercent.toString());
      percent ??= rawPercent is num ? rawPercent.toDouble() : null;
    }

    String? typeName;
    final loai = json['loaikhuyenmai'] is Map<String, dynamic>
        ? json['loaikhuyenmai'] as Map<String, dynamic>
        : null;
    final rawType =
        (json['loaikhuyenmai'] is String ? json['loaikhuyenmai'] : json['loai'])
            ?.toString();

    typeName = (loai?['tenloai'] ??
            loai?['tenLoai'] ??
            json['tenloai'] ??
            json['tenLoai'])
        ?.toString()
        .trim();
    if ((typeName == null || typeName.isEmpty) && rawType != null) {
      if (rawType == 'GIAM_PERCENT') {
        typeName = 'Giảm %';
      } else if (rawType == 'TANG') {
        typeName = 'Tặng';
      } else {
        typeName = rawType;
      }
    }

    final programName =
        (json['tenchuongtrinh'] ?? json['tenChuongTrinh'] ?? '').toString().trim();

    if (typeName == null || typeName.isEmpty) {
      if (percent != null && percent > 0) {
        final formatted = (percent % 1 == 0)
            ? percent.toStringAsFixed(0)
            : percent.toStringAsFixed(1);
        typeName = 'Giảm $formatted%';
      } else {
        typeName = programName;
      }
    }

    final start = parseVietnamDateTime(json['ngaybatdau'] ?? json['ngayBatDau']);
    final end = parseVietnamDateTime(json['ngayketthuc'] ?? json['ngayKetThuc']);
    final description =
        (json['mota'] ?? json['moTa'] ?? json['description'])?.toString();
    final voucherCode =
        (json['macode'] ?? json['maCode'] ?? json['code'])?.toString().trim();
    double? amountOff;
    final rawAmount =
        json['sotiengiam'] ?? json['soTienGiam'] ?? json['giam_toi_da'] ?? json['amount'];
    if (rawAmount != null) {
      amountOff = double.tryParse(rawAmount.toString());
      amountOff ??= rawAmount is num ? rawAmount.toDouble() : null;
    }

    return ProductPromotionInfo(
      promoId: json['makhuyenmai'] ?? json['id'] ?? 0,
      programName: programName.isNotEmpty ? programName : (typeName ?? ''),
      label: typeName ?? '',
      description: (description != null && description.trim().isNotEmpty)
          ? description.trim()
          : null,
      voucherCode:
          (voucherCode != null && voucherCode.isNotEmpty) ? voucherCode : null,
      startAt: start,
      endAt: end,
      percent: percent,
      amountOff: amountOff,
    );
  }
}
