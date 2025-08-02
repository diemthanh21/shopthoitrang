class ChiTietDonHang {
  constructor({
    machitietdonhang,
    madonhang,
    machitietsanpham,
    soluong,
    dongia
  }) {
    this.maChiTietDonHang = machitietdonhang;
    this.maDonHang = madonhang;
    this.maChiTietSanPham = machitietsanpham;
    this.soLuong = soluong;
    this.donGia = dongia;
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
