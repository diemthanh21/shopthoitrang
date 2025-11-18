class Rating {
  final int id; // madanhgia
  final int productId; // masanpham
  final int? variantId; // machitietsanpham (optional)
  final int customerId; // makhachhang
  final int score; // diemdanhgia (1-5)
  final String? comment; // binhluan
  final DateTime date; // ngaydanhgia

  Rating({
    required this.id,
    required this.productId,
    this.variantId,
    required this.customerId,
    required this.score,
    this.comment,
    required this.date,
  });

  factory Rating.fromJson(Map<String, dynamic> j) {
    return Rating(
      id: j['madanhgia'] ?? j['id'] ?? 0,
      productId: j['masanpham'] ?? j['productId'] ?? 0,
      variantId: j['machitietsanpham'] ?? j['variantId'],
      customerId: j['makhachhang'] ?? j['customerId'] ?? 0,
      score: (j['diemdanhgia'] is num)
          ? (j['diemdanhgia'] as num).toInt()
          : int.tryParse('${j['diemdanhgia']}') ?? 0,
      comment: j['binhluan']?.toString(),
      date: j['ngaydanhgia'] != null
          ? DateTime.parse(j['ngaydanhgia'].toString())
          : DateTime.now(),
    );
  }
}
