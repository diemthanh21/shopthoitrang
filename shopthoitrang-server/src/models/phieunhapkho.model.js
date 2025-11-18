class PhieuNhapKho {
  constructor({
    maphieunhap,
    manhanvien,
    maphieudathang,
    ngaynhap,
    trangthai,
    ghichu
  }) {
    this.maPhieuNhap = maphieunhap;
    this.maNhanVien = manhanvien;
    this.maPhieuDatHang = maphieudathang;
    this.ngayNhap = ngaynhap;
    this.trangThai = trangthai;
    this.ghiChu = ghichu;
  }

  toJSON() {
    return {
      maphieunhap: this.maPhieuNhap,
      manhanvien: this.maNhanVien,
      maphieudathang: this.maPhieuDatHang,
      ngaynhap: this.ngayNhap,
      trangthai: this.trangThai,
      ghichu: this.ghiChu
    };
  }
}

module.exports = PhieuNhapKho;
