class HinhAnhSanPham {
  constructor({
    mahinhanh, machitietsanpham, duongdanhinhanh
  }) {
    this.maHinhAnh = mahinhanh;
    this.maChiTietSanPham = machitietsanpham;
    this.duongDanHinhAnh = duongdanhinhanh;
  }

  toJSON() {
    return {
      mahinhanh: this.maHinhAnh,
      machitietsanpham: this.maChiTietSanPham,
      duongdanhinhanh: this.duongDanHinhAnh
    };
  }
}

module.exports = HinhAnhSanPham;
