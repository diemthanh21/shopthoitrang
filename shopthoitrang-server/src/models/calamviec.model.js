class CaLamViec {
  constructor({ maca = null, tenca, giobatdau, gioketthuc, mota = null }) {
    this.maca = maca;
    this.tenca = tenca;
    this.giobatdau = giobatdau;   // 'HH:MM' hoặc 'HH:MM:SS'
    this.gioketthuc = gioketthuc; // 'HH:MM' hoặc 'HH:MM:SS'
    this.mota = mota;
  }

  toJSON() {
    return {
      maca: this.maca,
      tenca: this.tenca,
      giobatdau: this.giobatdau,
      gioketthuc: this.gioketthuc,
      mota: this.mota,
    };
  }
}

module.exports = CaLamViec;
