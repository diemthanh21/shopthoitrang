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
    ghichu
  }) {
    this.maTraHang = matrahang;
    this.maDonHang = madonhang;
    this.maKhachHang = makhachhang;
    this.maChiTietSanPham = machitietsanpham;
    this.soLuong = soluong;
    this.lyDo = lydo;
    this.hinhAnhLoi = hinhanhloi;
    this.ngayYeuCau = ngayyeucau;   // TIMESTAMP
    this.trangThai = trangthai;     // 'CHỜ DUYỆT' / 'ĐÃ CHẤP NHẬN' / 'TỪ CHỐI'
    this.ghiChu = ghichu;
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
      ghichu: this.ghiChu
    };
  }
}

module.exports = TraHang;
