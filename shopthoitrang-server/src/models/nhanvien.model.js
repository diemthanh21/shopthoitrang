// nhanvien.model.js
class NhanVien {
  constructor({
    MANHANVIEN, HOTEN, EMAIL, SODIENTHOAI, NGAYSINH, 
    DIACHI, MACHUCNANG, MAQUANLY
  }) {
    this.maNhanVien = MANHANVIEN;
    this.hoTen = HOTEN;
    this.email = EMAIL;
    this.soDienThoai = SODIENTHOAI;
    this.ngaySinh = NGAYSINH;
    this.diaChi = DIACHI;
    this.maChucNang = MACHUCNANG;
    this.maQuanLy = MAQUANLY;
  }

  toJSON() {
    return {
      maNhanVien: this.maNhanVien,
      hoTen: this.hoTen,
      email: this.email,
      soDienThoai: this.soDienThoai,
      ngaySinh: this.ngaySinh,
      diaChi: this.diaChi,
      maChucNang: this.maChucNang,
      maQuanLy: this.maQuanLy
    };
  }
}

module.exports = NhanVien;