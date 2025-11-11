class PhieuNhapKho {
  constructor({
    maphieunhap,
    manhanvien,
    manhacungcap,
    ngaynhap,
    trangthai,
    ghichu
  }) {
    this.maPhieuNhap = maphieunhap;
    this.maNhanVien = manhanvien;
    this.maNhaCungCap = manhacungcap;
    this.ngayNhap = ngaynhap;
    this.trangThai = trangthai;
    this.ghiChu = ghichu;
  }

  toJSON() {
    return {
      maphieunhap: this.maPhieuNhap,
      manhanvien: this.maNhanVien,
      manhacungcap: this.maNhaCungCap,
      ngaynhap: this.ngayNhap,
      trangthai: this.trangThai,
      ghichu: this.ghiChu
    };
  }
}

module.exports = PhieuNhapKho;
