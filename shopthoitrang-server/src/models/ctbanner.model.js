class CTBanner {
  constructor({ mabanner, manhanvien, thoigiandoi }) {
    this.mabanner = mabanner;
    this.manhanvien = manhanvien;
    this.thoigiandoi = thoigiandoi;
  }

  toJSON() {
    return {
      mabanner: this.mabanner,
      manhanvien: this.manhanvien,
      thoigiandoi: this.thoigiandoi,
    };
  }
}

module.exports = CTBanner;
