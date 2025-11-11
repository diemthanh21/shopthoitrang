class ChiTietPhieuNhap {
  constructor({
    machitietnhap,
    maphieunhap,
    machitietsanpham,
    soluong,
    ghichu
  }) {
    this.machitietnhap = machitietnhap;
    this.maphieunhap = maphieunhap;
    this.machitietsanpham = machitietsanpham;
    this.soluong = soluong;
    this.ghichu = ghichu ?? null;
  }

  toJSON() {
    return {
      machitietnhap: this.machitietnhap,
      maphieunhap: this.maphieunhap,
      machitietsanpham: this.machitietsanpham,
      soluong: this.soluong,
      ghichu: this.ghichu
    };
  }
}

module.exports = ChiTietPhieuNhap;
