// hinhanhsanpham.model.js
class HinhAnhSanPham {
  constructor({
    MAHINHANH, MACHITIETSANPHAM, DUONGDANHINHANH
  }) {
    this.maHinhAnh = MAHINHANH;
    this.maChiTietSanPham = MACHITIETSANPHAM;
    this.duongDanHinhAnh = DUONGDANHINHANH;
  }

  toJSON() {
    return {
      maHinhAnh: this.maHinhAnh,
      maChiTietSanPham: this.maChiTietSanPham,
      duongDanHinhAnh: this.duongDanHinhAnh
    };
  }
}

module.exports = HinhAnhSanPham;