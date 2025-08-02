class Banner {
  constructor({
    mabanner, duongdananh, mota, lienket, thutuhienthi, danghoatdong
  }) {
    this.maBanner = mabanner;
    this.duongDanAnh = duongdananh;
    this.moTa = mota;
    this.lienKet = lienket;
    this.thuTuHienThi = thutuhienthi;
    this.dangHoatDong = danghoatdong;
  }

  toJSON() {
    return {
      mabanner: this.maBanner,
      duongdananh: this.duongDanAnh,
      mota: this.moTa,
      lienket: this.lienKet,
      thutuhienthi: this.thuTuHienThi,
      danghoatdong: this.dangHoatDong
    };
  }
}

module.exports = Banner;
