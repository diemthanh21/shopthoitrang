class BannerModel {
  final int? id; // mabanner
  final String imageUrl; // duongdananh
  final String? description; // mota
  final int? order; // thutuhienthi
  final bool active; // danghoatdong

  BannerModel({
    this.id,
    required this.imageUrl,
    this.description,
    this.order,
    required this.active,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['mabanner'] ?? json['maBanner'] ?? json['id'],
      imageUrl: (json['duongdananh'] ?? json['duongDanAnh'] ?? '').toString(),
      description: json['mota'] ?? json['moTa'],
      order: json['thutuhienthi'] ?? json['thuTuHienThi'],
      active: json['danghoatdong'] is bool
          ? json['danghoatdong']
          : (json['dangHoatDong'] is bool ? json['dangHoatDong'] : true),
    );
  }
}
