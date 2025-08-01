// phieunhapkho.model.js
class PhieuNhapKho {
  constructor({
    MAPHIEUNHAP, MANHANVIEN, MANHACUNGCAP, NGAYNHAP,
    THANHTIEN, GHICHU
  }) {
    this.maPhieuNhap = MAPHIEUNHAP;
    this.maNhanVien = MANHANVIEN;
    this.maNhaCungCap = MANHACUNGCAP;
    this.ngayNhap = NGAYNHAP;
    this.thanhTien = THANHTIEN;
    this.ghiChu = GHICHU;
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