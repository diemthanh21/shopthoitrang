class VaiTroPhu {
  constructor({ mavaitro, manhanvien, machucnang }) {
    this.maVaiTro = mavaitro;
    this.maNhanVien = manhanvien;
    this.maChucNang = machucnang;
  }

  toJSON() {
    return {
      maVaiTro: this.maVaiTro,
      maNhanVien: this.maNhanVien,
      maChucNang: this.maChucNang
    };
  }
}

module.exports = VaiTroPhu;
