class ThuongHieu {
  constructor({
    mathuonghieu,
    tenthuonghieu
  }) {
    this.maThuongHieu = mathuonghieu;
    this.tenThuongHieu = tenthuonghieu;
  }

  toJSON() {
    return {
      mathuonghieu: this.maThuongHieu,
      tenthuonghieu: this.tenThuongHieu
    };
  }
}

module.exports = ThuongHieu;
