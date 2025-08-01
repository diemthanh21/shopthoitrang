// taikhoankhachhang.model.js
class TaiKhoanKhachHang {
  constructor({
    MAKHACHHANG, HOTEN, TENDANGNHAP, EMAIL, PASS, 
    SODIENTHOAI, DANGHOATDONG, ANHDAIDIEN
  }) {
    this.maKhachHang = MAKHACHHANG;
    this.hoTen = HOTEN;
    this.tenDangNhap = TENDANGNHAP;
    this.email = EMAIL;
    this.pass = PASS;
    this.soDienThoai = SODIENTHOAI;
    this.dangHoatDong = DANGHOATDONG;
    this.anhDaiDien = ANHDAIDIEN;
  }

  toJSON() {
    return {
      maKhachHang: this.maKhachHang,
      hoTen: this.hoTen,
      tenDangNhap: this.tenDangNhap,
      email: this.email,
      soDienThoai: this.soDienThoai,
      dangHoatDong: this.dangHoatDong,
      anhDaiDien: this.anhDaiDien
    };
  }
}

module.exports = TaiKhoanKhachHang;