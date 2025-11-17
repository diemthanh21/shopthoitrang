import '../utils/datetime_utils.dart';

class ProductPromotionInfo {
  final int promoId;
  final String label;
  final DateTime? startAt;
  final DateTime? endAt;
  final double? percent;

  const ProductPromotionInfo({
    required this.promoId,
    required this.label,
    this.startAt,
    this.endAt,
    this.percent,
  });

  factory ProductPromotionInfo.fromJson(Map<String, dynamic> j) {
    double? percent;
    final rawPercent = j['tylegiam'] ?? j['tyleGiam'] ?? j['percent'];
    if (rawPercent != null) {
      percent = double.tryParse(rawPercent.toString());
      percent ??= rawPercent is num ? rawPercent.toDouble() : null;
    }

    String? typeName;
    final loai = j['loaikhuyenmai'] is Map<String, dynamic>
        ? j['loaikhuyenmai'] as Map<String, dynamic>
        : null;
    final rawType =
        (j['loaikhuyenmai'] is String ? j['loaikhuyenmai'] : j['loai'])
            ?.toString();

    typeName = (loai?['tenloai'] ??
            loai?['tenLoai'] ??
            j['tenloai'] ??
            j['tenLoai'])?.toString().trim();
    if ((typeName == null || typeName.isEmpty) && rawType != null) {
      if (rawType == 'GIAM_PERCENT') {
        typeName = 'Giảm %';
      } else if (rawType == 'TANG') {
        typeName = 'Tặng';
      } else {
        typeName = rawType;
      }
    }

    if (typeName == null || typeName.isEmpty) {
      if (percent != null && percent > 0) {
        final formatted = (percent % 1 == 0)
            ? percent.toStringAsFixed(0)
            : percent.toStringAsFixed(1);
        typeName = 'Giảm $formatted%';
      } else {
        typeName = (j['tenchuongtrinh'] ?? j['tenChuongTrinh'] ?? '')
            .toString()
            .trim();
      }
    }

    final start = parseVietnamDateTime(j['ngaybatdau'] ?? j['ngayBatDau']);
    final end = parseVietnamDateTime(j['ngayketthuc'] ?? j['ngayKetThuc']);

    return ProductPromotionInfo(
      promoId: j['makhuyenmai'] ?? j['id'] ?? 0,
      label: typeName ?? '',
      startAt: start,
      endAt: end,
      percent: percent,
    );
  }
}
