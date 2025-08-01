// magiamgia.model.js
class MaGiamGia {
  constructor({
    MAVOUCHER, MACODE, MADONHANG, MOTA, GIATRIGIAM,
    SOLUONG, NGAYBATDAU, NGAYKETTHUC, MANHANVIEN
  }) {
    this.maVoucher = MAVOUCHER;
    this.maCode = MACODE;
    this.maDonHang = MADONHANG;
    this.moTa = MOTA;
    this.giaTriGiam = GIATRIGIAM;
    this.soLuong = SOLUONG;
    this.ngayBatDau = NGAYBATDAU;
    this.ngayKetThuc = NGAYKETTHUC;
    this.maNhanVien = MANHANVIEN;
  }

  toJSON() {
    return {
      maVoucher: this.maVoucher,
      maCode: this.maCode,
      maDonHang: this.maDonHang,
      moTa: this.moTa,
      giaTriGiam: this.giaTriGiam,
      soLuong: this.soLuong,
      ngayBatDau: this.ngayBatDau,
      ngayKetThuc: this.ngayKetThuc,
      maNhanVien: this.maNhanVien
    };
  }
}

module.exports = MaGiamGia;