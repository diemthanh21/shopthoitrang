class TaiKhoanNhanVien {
  constructor({
    manhanvien, tendangnhap, matkhau, danghoatdong
  }) {
    this.maNhanVien = manhanvien;
    this.tenDangNhap = tendangnhap;
    this.matKhau = matkhau;
    this.dangHoatDong = danghoatdong;
  }

  toJSON() {
    return {
      manhanvien: this.maNhanVien,
      tendangnhap: this.tenDangNhap,
      matkhau: this.matKhau,
      danghoatdong: this.dangHoatDong
    };
  }
}

module.exports = TaiKhoanNhanVien;
