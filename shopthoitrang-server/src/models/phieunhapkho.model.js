class PhieuNhapKho {
  constructor({
    maphieunhap,
    manhanvien,
    manhacungcap,
    ngaynhap,
    thanhtien,
    ghichu
  }) {
    this.maPhieuNhap = maphieunhap;
    this.maNhanVien = manhanvien;
    this.maNhaCungCap = manhacungcap;
    this.ngayNhap = ngaynhap;
    this.thanhTien = thanhtien;
    this.ghiChu = ghichu;
  }

  toJSON() {
    return {
      maPhieuNhap: this.maPhieuNhap,
      maNhanVien: this.maNhanVien,
      maNhaCungCap: this.maNhaCungCap,
      ngayNhap: this.ngayNhap,
      thanhTien: this.thanhTien,
      ghiChu: this.ghiChu
    };
  }
}

module.exports = PhieuNhapKho;
