class TraHang {
  constructor({
    matrahang,
    madonhang,
    makhachhang,
    machitietsanpham,
    soluong,
    lydo,
    hinhanhloi,
    ngayyeucau,
    trangthai,
    ghichu,
    ly_do_tu_choi,
    ly_do_khong_hop_le,
    diachiguihang,
    huongdan_donggoi,
    ngayduyet,
    ngaynhanhang,
    ngaykiemtra,
    trangthaikiemtra,
    sotien_hoan,
    phuongthuc_hoan,
    ngayhoantien
  }) {
    // Canonical camelCase fields
    this.maTraHang = matrahang;
    this.maDonHang = madonhang;
    this.maKhachHang = makhachhang;
    this.maChiTietSanPham = machitietsanpham;
    this.soLuong = soluong;
    this.lyDo = lydo;
    this.hinhAnhLoi = hinhanhloi;
    this.ngayYeuCau = ngayyeucau;   // TIMESTAMP
    this.trangThai = trangthai;     // lifecycle status (camelCase primary)
    this.trangthai = trangthai;     // alias to match service code expecting lowercase
  this.ghiChu = ghichu;
    // Extended fields per full workflow spec
    this.lyDoTuChoi = ly_do_tu_choi;
    this.lyDoKhongHopLe = ly_do_khong_hop_le;
    this.diaChiGuiHang = diachiguihang;
    this.huongDanDongGoi = huongdan_donggoi;
    this.ngayDuyet = ngayduyet;
    this.ngayNhanHang = ngaynhanhang;
    this.ngayKiemTra = ngaykiemtra;
    this.trangThaiKiemTra = trangthaikiemtra;
    this.soTienHoan = sotien_hoan;
    this.phuongThucHoan = phuongthuc_hoan;
    this.ngayHoanTien = ngayhoantien;

    // Lowercase alias fields for backward compatibility with service code
    this.matrahang = matrahang;
    this.madonhang = madonhang;
    this.makhachhang = makhachhang;
    this.machitietsanpham = machitietsanpham;
    this.soluong = soluong;
    this.lydo = lydo;
    this.hinhanhloi = hinhanhloi;
    this.ngayyeucau = ngayyeucau;
    this.ghichu = ghichu;
  }

  toJSON() {
    return {
      matrahang: this.maTraHang,
      madonhang: this.maDonHang,
      makhachhang: this.maKhachHang,
      machitietsanpham: this.maChiTietSanPham,
      soluong: this.soLuong,
      lydo: this.lyDo,
      hinhanhloi: this.hinhAnhLoi,
      ngayyeucau: this.ngayYeuCau,
      trangthai: this.trangThai,
      ghichu: this.ghiChu,
      ly_do_tu_choi: this.lyDoTuChoi,
      ly_do_khong_hop_le: this.lyDoKhongHopLe,
      diachiguihang: this.diaChiGuiHang,
      huongdan_donggoi: this.huongDanDongGoi,
      ngayduyet: this.ngayDuyet,
      ngaynhanhang: this.ngayNhanHang,
      ngaykiemtra: this.ngayKiemTra,
      trangthaikiemtra: this.trangThaiKiemTra,
      sotien_hoan: this.soTienHoan,
      phuongthuc_hoan: this.phuongThucHoan,
      ngayhoantien: this.ngayHoanTien
    };
  }
}

module.exports = TraHang;
