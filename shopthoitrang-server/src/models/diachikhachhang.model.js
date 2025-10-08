class DiaChiKhachHang {
  constructor({ madiachi, makhachhang, diachi }) {
    this.madiachi = madiachi;
    this.makhachhang = makhachhang;
    this.diachi = diachi;
  }

  toJSON() {
    return {
      madiachi: this.madiachi,
      makhachhang: this.makhachhang,
      diachi: this.diachi,
    };
  }
}

module.exports = DiaChiKhachHang;
