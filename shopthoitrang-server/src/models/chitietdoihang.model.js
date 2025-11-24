class ChiTietDoiHang {
  constructor({
    mactdoihang,
    madoihang,
    machitietsanphamcu,
    machitietsanphammoi,
    soluong,
    lydo,
    manhanvien,
    hinhanh,
  }) {
    this.mactdoihang = mactdoihang;
    this.madoihang = madoihang;
    this.machitietsanphamcu = machitietsanphamcu;
    this.machitietsanphammoi = machitietsanphammoi;
    this.soluong = soluong;
    this.lydo = lydo;
    this.manhanvien = manhanvien;
    this.hinhanh = hinhanh;
    this.variantCu = null;
    this.variantMoi = null;
  }

  toJSON() {
    return {
      mactdoihang: this.mactdoihang,
      madoihang: this.madoihang,
      machitietsanphamcu: this.machitietsanphamcu,
      machitietsanphammoi: this.machitietsanphammoi,
      soluong: this.soluong,
      lydo: this.lydo,
      manhanvien: this.manhanvien,
      hinhanh: this.hinhanh,
      variantCu: this.variantCu,
      variantMoi: this.variantMoi,
    };
  }
}

module.exports = ChiTietDoiHang;
