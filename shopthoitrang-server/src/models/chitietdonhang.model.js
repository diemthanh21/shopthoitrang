// chitietdonhang.model.js
class ChiTietDonHang {
  constructor({
    MACHITIETDONHANG, MADONHANG, MACHITIETSANPHAM, 
    SOLUONG, DONGIA
  }) {
    this.maChiTietDonHang = MACHITIETDONHANG;
    this.maDonHang = MADONHANG;
    this.maChiTietSanPham = MACHITIETSANPHAM;
    this.soLuong = SOLUONG;
    this.donGia = DONGIA;
  }

  toJSON() {
    return {
      maChiTietDonHang: this.maChiTietDonHang,
      maDonHang: this.maDonHang,
      maChiTietSanPham: this.maChiTietSanPham,
      soLuong: this.soLuong,
      donGia: this.donGia
    };
  }
}

module.exports = ChiTietDonHang;