class DonHang {
  constructor({
    madonhang, makhachhang, ngaydathang, thanhtien,
    phuongthucthanhtoan, trangthaithanhtoan, trangthaidonhang
  }) {
    this.maDonHang = madonhang;
    this.maKhachHang = makhachhang;
    this.ngayDatHang = ngaydathang;
    this.thanhTien = thanhtien;
    this.phuongThucThanhToan = phuongthucthanhtoan;
    this.trangThaiThanhToan = trangthaithanhtoan;
    this.trangThaiDonHang = trangthaidonhang;
  }

  toJSON() {
    return {
      maDonHang: this.maDonHang,
      maKhachHang: this.maKhachHang,
      ngayDatHang: this.ngayDatHang,
      thanhTien: this.thanhTien,
      phuongThucThanhToan: this.phuongThucThanhToan,
      trangThaiThanhToan: this.trangThaiThanhToan,
      trangThaiDonHang: this.trangThaiDonHang
    };
  }
}

module.exports = DonHang;