class ChucNang {
  constructor({ machucnang, tenchucnang }) {
    this.machucnang = machucnang;
    this.tenchucnang = tenchucnang;
  }

  toJSON() {
    return {
      machucnang: this.machucnang,
      tenchucnang: this.tenchucnang
    };
  }
}

module.exports = ChucNang;