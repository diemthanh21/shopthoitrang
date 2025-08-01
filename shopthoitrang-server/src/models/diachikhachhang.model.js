// diachikhachhang.model.js
class DiaChiKhachHang {
  constructor({
    MADIACHI, MAKHACHHANG, DIACHI, MAPHUONGXA
  }) {
    this.maDiaChi = MADIACHI;
    this.maKhachHang = MAKHACHHANG;
    this.diaChi = DIACHI;
    this.maPhuongXa = MAPHUONGXA;
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