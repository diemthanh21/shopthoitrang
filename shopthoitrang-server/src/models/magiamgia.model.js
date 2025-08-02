class MaGiamGia {
  constructor({
    mavoucher, macode, madonhang, mota, giatrigiam,
    soluong, ngaybatdau, ngayketthuc, manhanvien
  }) {
    this.maVoucher = mavoucher;
    this.maCode = macode;
    this.maDonHang = madonhang;
    this.moTa = mota;
    this.giaTriGiam = giatrigiam;
    this.soLuong = soluong;
    this.ngayBatDau = ngaybatdau;
    this.ngayKetThuc = ngayketthuc;
    this.maNhanVien = manhanvien;
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
