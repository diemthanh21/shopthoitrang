class KichThuoc {
  constructor({ makichthuoc, ten_kichthuoc, mo_ta }) {
    this.maKichThuoc = makichthuoc;
    this.tenKichThuoc = ten_kichthuoc;
    this.moTa = mo_ta ?? null;
  }

  toJSON() {
    return {
      makichthuoc: this.maKichThuoc,
      ten_kichthuoc: this.tenKichThuoc,
      mo_ta: this.moTa,
    };
  }
}

module.exports = KichThuoc;
