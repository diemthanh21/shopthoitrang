// chitietphieunhap.model.js
class ChiTietPhieuNhap {
  constructor({
    MACHITIETNHAP, MAPHIEUNHAP, MACHITIETSANPHAM, 
    SOLUONG, DONGIANHAP
  }) {
    this.maChiTietNhap = MACHITIETNHAP;
    this.maPhieuNhap = MAPHIEUNHAP;
    this.maChiTietSanPham = MACHITIETSANPHAM;
    this.soLuong = SOLUONG;
    this.donGiaNhap = DONGIANHAP;
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