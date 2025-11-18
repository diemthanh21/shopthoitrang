class BannerModel {
  final int? id; // mabanner
  final String imageUrl; // duongdananh
  final String? description; // mota
  final String? link; // lienket
  final int? order; // thutuhienthi
  final bool active; // danghoatdong

  BannerModel({
    this.id,
    required this.imageUrl,
    this.description,
    this.link,
    this.order,
    required this.active,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['mabanner'] ?? json['maBanner'] ?? json['id'],
      imageUrl: (json['duongdananh'] ?? json['duongDanAnh'] ?? '').toString(),
      description: json['mota'] ?? json['moTa'],
      link: json['lienket'] ?? json['lienKet'],
      order: json['thutuhienthi'] ?? json['thuTuHienThi'],
      active: json['danghoatdong'] is bool
          ? json['danghoatdong']
          : (json['dangHoatDong'] is bool ? json['dangHoatDong'] : true),
    );
  }
}
