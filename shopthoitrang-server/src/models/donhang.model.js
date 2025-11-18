class DonHang {
  constructor({
    madonhang,
    makhachhang,
    manhanvien,
    ngaydathang,
    thanhtien,
    phuongthucthanhtoan,
    trangthaithanhtoan,
    trangthaidonhang,
    madiachi,
    ngaygiaohang,
  }) {
    this.madonhang = madonhang;
    this.makhachhang = makhachhang;
    this.manhanvien = manhanvien || null;
    this.ngaydathang = ngaydathang;
    this.ngaygiaohang = ngaygiaohang || null; // thời điểm xác nhận đã giao
    this.thanhtien = thanhtien;
    this.phuongthucthanhtoan = phuongthucthanhtoan;
    this.trangthaithanhtoan = trangthaithanhtoan;
    this.trangthaidonhang = trangthaidonhang;
    this.madiachi = madiachi; // optional link to diachikhachhang
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = DonHang;
