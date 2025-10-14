class TaiKhoanKhachHang {
  constructor({
    makhachhang,
    hoten,
    tendangnhap,
    email,
    pass,
    sodienthoai,
    gioitinh,
    ngaysinh,
    danghoatdong
  }) {
    this.maKhachHang = makhachhang;
    this.hoTen = hoten;
    this.tenDangNhap = tendangnhap;
    this.email = email;
    this.matKhau = pass;
    this.soDienThoai = sodienthoai;
    this.gioiTinh = gioitinh;
    this.ngaySinh = ngaysinh;
    this.dangHoatDong = danghoatdong;
  }

  toJSON() {
    return {
      makhachhang: this.maKhachHang,
      hoten: this.hoTen,
      tendangnhap: this.tenDangNhap,
      email: this.email,
      sodienthoai: this.soDienThoai,
      gioitinh: this.gioiTinh,
      ngaysinh: this.ngaySinh,
      danghoatdong: this.dangHoatDong
    };
  }
}

module.exports = TaiKhoanKhachHang;
