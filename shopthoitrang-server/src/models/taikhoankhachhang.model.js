class TaiKhoanKhachHang {
  constructor({
    makhachhang,
    hoten,
    tendangnhap,
    email,
    pass,
    sodienthoai,
    danghoatdong,
    anhdaidien
  }) {
    this.maKhachHang = makhachhang;
    this.hoTen = hoten;
    this.tenDangNhap = tendangnhap;
    this.email = email;
    this.matKhau = pass;
    this.soDienThoai = sodienthoai;
    this.dangHoatDong = danghoatdong;
    this.anhDaiDien = anhdaidien;
  }

  toJSON() {
    return {
      makhachhang: this.maKhachHang,
      hoten: this.hoTen,
      tendangnhap: this.tenDangNhap,
      email: this.email,
      sodienthoai: this.soDienThoai,
      danghoatdong: this.dangHoatDong,
      anhdaidien: this.anhDaiDien
    };
  }
}

module.exports = TaiKhoanKhachHang;
