class DoiHang {
  constructor({
    madoihang,
    madonhang,
    makhachhang,
    machitietsanphamcu,
    machitietsanphamoi,
    soluong,
    lydo,
    ngayyeucau,
    trangthai,
    ghichu
  }) {
    this.madoihang = madoihang;
    this.madonhang = madonhang;
    this.makhachhang = makhachhang;
    this.machitietsanphamcu = machitietsanphamcu;
    this.machitietsanphamoi = machitietsanphamoi;
    this.soluong = soluong;
    this.lydo = lydo;
    this.ngayyeucau = ngayyeucau;
    this.trangthai = trangthai;
    this.ghichu = ghichu;
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = DoiHang;
