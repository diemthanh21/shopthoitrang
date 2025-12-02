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
    lydohuy,
    nhanvien_duyet,
    ...rest
  }) {
    this.madonhang = madonhang;
    this.makhachhang = makhachhang;
    this.manhanvien = manhanvien || null; // mã NV duyệt / xử lý
    this.ngaydathang = ngaydathang;
    this.ngaygiaohang = ngaygiaohang || null;
    this.thanhtien = thanhtien;
    this.phuongthucthanhtoan = phuongthucthanhtoan;
    this.trangthaithanhtoan = trangthaithanhtoan;
    this.trangthaidonhang = trangthaidonhang;
    this.madiachi = madiachi || null;

    // NEW
    this.lydohuy = lydohuy ?? null;
    this.nhanvien_duyet = nhanvien_duyet ?? null; // { manhanvien, hoten }

    // Giữ các field dư khác nếu có
    Object.assign(this, rest);
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = DonHang;
