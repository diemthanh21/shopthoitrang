class ChiTietSanPham {
  constructor({
    machitietsanpham,
    masanpham,
    kichthuoc,
    mausac,
    chatlieu,
    mota,
    giaban,
    soluongton,
  }) {
    this.machitietsanpham = machitietsanpham;
    this.masanpham = masanpham;
    this.kichthuoc = kichthuoc ?? null;
    this.mausac = mausac ?? null;
    this.chatlieu = chatlieu ?? null;
    this.mota = mota ?? null;
    this.giaban = giaban;
    this.soluongton = soluongton ?? 0;
  }

  toJSON() {
    return {
      machitietsanpham: this.machitietsanpham,
      masanpham: this.masanpham,
      kichthuoc: this.kichthuoc,
      mausac: this.mausac,
      chatlieu: this.chatlieu,
      mota: this.mota,
      giaban: this.giaban,
      soluongton: this.soluongton,
    };
  }
}

module.exports = ChiTietSanPham;
