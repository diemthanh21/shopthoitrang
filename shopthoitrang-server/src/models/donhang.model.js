class DonHang {
  constructor({
    madonhang,
    makhachhang,
    ngaydathang,
    thanhtien,
    phuongthucthanhtoan,
    trangthaithanhtoan,
    trangthaidonhang
  }) {
    this.madonhang = madonhang;
    this.makhachhang = makhachhang;
    this.ngaydathang = ngaydathang;
    this.thanhtien = thanhtien;
    this.phuongthucthanhtoan = phuongthucthanhtoan;
    this.trangthaithanhtoan = trangthaithanhtoan;
    this.trangthaidonhang = trangthaidonhang;
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = DonHang;
