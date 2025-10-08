class NhanVien {
  constructor({
    manhanvien,
    hoten,
    email,
    sodienthoai,
    ngaysinh,
    diachi,
    machucnang,
    maquanly
  }) {
    this.maNhanVien = manhanvien;
    this.hoTen = hoten;
    this.email = email;
    this.soDienThoai = sodienthoai;
    this.ngaySinh = ngaysinh;
    this.diaChi = diachi;
    this.maChucNang = machucnang;
    this.maQuanLy = maquanly;
  }

  toJSON() {
    return {
      manhanvien: this.maNhanVien,
      hoten: this.hoTen,
      email: this.email,
      sodienthoai: this.soDienThoai,
      ngaysinh: this.ngaySinh,
      diachi: this.diaChi,
      machucnang: this.maChucNang,
      maquanly: this.maQuanLy
    };
  }
}

module.exports = NhanVien;
