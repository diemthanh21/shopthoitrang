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
      maphieunhap: this.maPhieuNhap,
      manhanvien: this.maNhanVien,
      manhacungcap: this.maNhaCungCap,
      ngaynhap: this.ngayNhap,
      thanhtien: this.thanhTien,
      ghichu: this.ghiChu
    };
  }
}

module.exports = PhieuNhapKho;
