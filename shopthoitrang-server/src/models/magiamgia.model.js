class MaGiamGia {
  constructor({
    mavoucher,
    macode,
    madonhang,
    mota,
    giatrigiam,
    soluong,
    ngaybatdau,
    ngayketthuc,
    manhanvien
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
      mavoucher: this.maVoucher,
      macode: this.maCode,
      madonhang: this.maDonHang,
      mota: this.moTa,
      giatrigiam: this.giaTriGiam,
      soluong: this.soLuong,
      ngaybatdau: this.ngayBatDau,
      ngayketthuc: this.ngayKetThuc,
      manhanvien: this.maNhanVien
    };
  }
}

module.exports = MaGiamGia;
