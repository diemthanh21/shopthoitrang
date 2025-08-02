class HuyDonHang {
  constructor({ mahuydon, madonhang, makhachhang, lydo, ngayyeucau, trangthai, ghichu }) {
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
      maHuyDon: this.maHuyDon,
      maDonHang: this.maDonHang,
      maKhachHang: this.maKhachHang,
      lyDo: this.lyDo,
      ngayYeuCau: this.ngayYeuCau,
      trangThai: this.trangThai,
      ghiChu: this.ghiChu
    };
  }
}

module.exports = HuyDonHang;
