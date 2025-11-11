class ChucNang {
  constructor({ machucnang, tenchucnang, maquyen }) {
    this.machucnang = machucnang;
    this.tenchucnang = tenchucnang;
    this.maquyen = maquyen;
  }

  toJSON() {
    return {
      machucnang: this.machucnang,
      tenchucnang: this.tenchucnang,
      maquyen: this.maquyen
    };
  }
}

module.exports = ChucNang;
