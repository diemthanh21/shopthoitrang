// taikhoannhanvien.model.js
class TaiKhoanNhanVien {
  constructor({
    MANHANVIEN, TENDANGNHAP, MATKHAU, DANGHOATDONG
  }) {
    this.maNhanVien = MANHANVIEN;
    this.tenDangNhap = TENDANGNHAP;
    this.matKhau = MATKHAU;
    this.dangHoatDong = DANGHOATDONG;
  }

  toJSON() {
    return {
      maNhanVien: this.maNhanVien,
      tenDangNhap: this.tenDangNhap,
      dangHoatDong: this.dangHoatDong
    };
  }
}

module.exports = TaiKhoanNhanVien;