// chucnang.model.js
class ChucNang {
  constructor({
    MACHUCNANG, TENCHUCNANG
  }) {
    this.maChucNang = MACHUCNANG;
    this.tenChucNang = TENCHUCNANG;
  }

  toJSON() {
    return {
      maChucNang: this.maChucNang,
      tenChucNang: this.tenChucNang
    };
  }
}

module.exports = ChucNang;