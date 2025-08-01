// donhang.model.js
class DonHang {
  constructor({
    MADONHANG, MAKHACHHANG, NGAYDATHANG, THANHTIEN,
    PHUONGTHUCTHANHTOAN, TRANGTHAITHANHTOAN, TRANGTHAIDONHANG
  }) {
    this.maDonHang = MADONHANG;
    this.maKhachHang = MAKHACHHANG;
    this.ngayDatHang = NGAYDATHANG;
    this.thanhTien = THANHTIEN;
    this.phuongThucThanhToan = PHUONGTHUCTHANHTOAN;
    this.trangThaiThanhToan = TRANGTHAITHANHTOAN;
    this.trangThaiDonHang = TRANGTHAIDONHANG;
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