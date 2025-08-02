class ChiTietPhieuNhap {
  constructor({
    machitietnhap,
    maphieunhap,
    machitietsanpham,
    soluong,
    dongianhap
  }) {
    this.maChiTietNhap = machitietnhap;
    this.maPhieuNhap = maphieunhap;
    this.maChiTietSanPham = machitietsanpham;
    this.soLuong = soluong;
    this.donGiaNhap = dongianhap;
  }

  toJSON() {
    return {
      maChiTietNhap: this.maChiTietNhap,
      maPhieuNhap: this.maPhieuNhap,
      maChiTietSanPham: this.maChiTietSanPham,
      soLuong: this.soLuong,
      donGiaNhap: this.donGiaNhap
    };
  }
}

module.exports = ChiTietPhieuNhap;
