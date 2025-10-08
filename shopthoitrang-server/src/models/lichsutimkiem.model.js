class LichSuTimKiem {
  constructor({
    malichsu,
    makhachhang,
    machitietsanpham,
    noidung,
    thoigiantk
  }) {
    this.maLichSu = malichsu;
    this.maKhachHang = makhachhang;
    this.maChiTietSanPham = machitietsanpham;
    this.noiDung = noidung;
    this.thoiGianTK = thoigiantk;
  }

  toJSON() {
    return {
      malichsu: this.maLichSu,
      makhachhang: this.maKhachHang,
      machitietsanpham: this.maChiTietSanPham,
      noidung: this.noiDung,
      thoigiantk: this.thoiGianTK
    };
  }
}

module.exports = LichSuTimKiem;
