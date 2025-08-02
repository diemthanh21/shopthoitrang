class CTBanner {
  constructor({ mabanner, manhanvien, thoigiandoi }) {
    this.maBanner = mabanner;
    this.maNhanVien = manhanvien;
    this.thoiGianDoi = thoigiandoi;
  }

  toJSON() {
    return {
      maBanner: this.maBanner,
      maNhanVien: this.maNhanVien,
      thoiGianDoi: this.thoiGianDoi
    };
  }
}

module.exports = CTBanner;
