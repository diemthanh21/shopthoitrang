class Banner {
  constructor({ mabanner, duongdananh, mota, thutuhienthi, danghoatdong }) {
    this.mabanner = mabanner ?? null;
    this.duongdananh = duongdananh;
    this.mota = mota ?? null;
    this.thutuhienthi = thutuhienthi ?? null;
    this.danghoatdong = typeof danghoatdong === 'boolean' ? danghoatdong : true;
  }

  toJSON() {
    return {
      mabanner: this.mabanner,
      duongdananh: this.duongdananh,
      mota: this.mota,
      thutuhienthi: this.thutuhienthi,
      danghoatdong: this.danghoatdong,
    };
  }
}
module.exports = Banner;
