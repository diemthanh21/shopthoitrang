class HuyDonHang {
  constructor({
    mahuydon,
    madonhang,
    makhachhang,
    lydo,
    ngayyeucau,
    trangthai,
    ghichu
  }) {
    this.maHuyDon = mahuydon;
    this.maDonHang = madonhang;
    this.maKhachHang = makhachhang;
    this.lyDo = lydo;
    this.ngayYeuCau = ngayyeucau;
    this.trangThai = trangthai;
    this.ghiChu = ghichu;
  }

  toJSON() {
    return {
      mahuydon: this.maHuyDon,
      madonhang: this.maDonHang,
      makhachhang: this.maKhachHang,
      lydo: this.lyDo,
      ngayyeucau: this.ngayYeuCau,
      trangthai: this.trangThai,
      ghichu: this.ghiChu
    };
  }
}

module.exports = HuyDonHang;
