class ChiTietPhieuNhap {
  constructor({
    machitietnhap,
    maphieunhap,
    machitietsanpham,
    soluong,
    dongianhap
  }) {
    this.machitietnhap = machitietnhap;
    this.maphieunhap = maphieunhap;
    this.machitietsanpham = machitietsanpham;
    this.soluong = soluong;
    this.dongianhap = dongianhap;
  }

  toJSON() {
    return {
      machitietnhap: this.machitietnhap,
      maphieunhap: this.maphieunhap,
      machitietsanpham: this.machitietsanpham,
      soluong: this.soluong,
      dongianhap: this.dongianhap
    };
  }
}

module.exports = ChiTietPhieuNhap;
