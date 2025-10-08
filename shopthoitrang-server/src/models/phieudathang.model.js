class PhieuDatHang {
  constructor({
    maphieudathang,
    makhachhang,
    manhanvien,
    ngaydatphieu,
    ngayhendukien,
    tongtien,
    tiencoc,
    conlai,
    phuongthucthanhtoan,
    trangthaiphieu,
    ghichu
  }) {
    this.maPhieuDatHang = maphieudathang;
    this.maKhachHang = makhachhang;
    this.maNhanVien = manhanvien;
    this.ngayDatPhieu = ngaydatphieu;
    this.ngayHenDuKien = ngayhendukien;
    this.tongTien = tongtien;
    this.tienCoc = tiencoc;
    this.conLai = conlai;
    this.phuongThucThanhToan = phuongthucthanhtoan;
    this.trangThaiPhieu = trangthaiphieu;
    this.ghiChu = ghichu;
  }

  toJSON() {
    return {
      maphieudathang: this.maPhieuDatHang,
      makhachhang: this.maKhachHang,
      manhanvien: this.maNhanVien,
      ngaydatphieu: this.ngayDatPhieu,
      ngayhendukien: this.ngayHenDuKien,
      tongtien: this.tongTien,
      tiencoc: this.tienCoc,
      conlai: this.conLai,
      phuongthucthanhtoan: this.phuongThucThanhToan,
      trangthaiphieu: this.trangThaiPhieu,
      ghichu: this.ghiChu
    };
  }
}

module.exports = PhieuDatHang;
