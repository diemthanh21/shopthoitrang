class Banner {
  constructor({ mabanner, duongdananh, mota, lienket, thutuhienthi, danghoatdong }) {
    this.mabanner = mabanner ?? null;
    this.duongdananh = duongdananh;
    this.mota = mota ?? null;
    this.lienket = lienket ?? null;
    this.thutuhienthi = thutuhienthi ?? null;
    this.danghoatdong = typeof danghoatdong === 'boolean' ? danghoatdong : true;
  }

  toJSON() {
    return {
      mabanner: this.mabanner,
      duongdananh: this.duongdananh,
      mota: this.mota,
      lienket: this.lienket,
      thutuhienthi: this.thutuhienthi,
      danghoatdong: this.danghoatdong,
    };
  }
}
module.exports = Banner;
