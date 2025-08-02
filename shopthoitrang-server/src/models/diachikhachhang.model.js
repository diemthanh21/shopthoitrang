class DiaChiKhachHang {
  constructor({
    madiachi, makhachhang, diachi, maphuongxa
  }) {
    this.maDiaChi = madiachi;
    this.maKhachHang = makhachhang;
    this.diaChi = diachi;
    this.maPhuongXa = maphuongxa;
  }

  toJSON() {
    return {
      maDiaChi: this.maDiaChi,
      maKhachHang: this.maKhachHang,
      diaChi: this.diaChi,
      maPhuongXa: this.maPhuongXa
    };
  }
}

module.exports = DiaChiKhachHang;
