class DoiHang {
  constructor({
    madoihang, madonhang, makhachhang, machitietsanphamcu,
    machitietsanphammoi, soluong, lydo, ngayyeucau, trangthai, ghichu
  }) {
    this.maDoiHang = madoihang;
    this.maDonHang = madonhang;
    this.maKhachHang = makhachhang;
    this.maChiTietSanPhamCu = machitietsanphamcu;
    this.maChiTietSanPhamMoi = machitietsanphammoi;
    this.soLuong = soluong;
    this.lyDo = lydo;
    this.ngayYeuCau = ngayyeucau;
    this.trangThai = trangthai;
    this.ghiChu = ghichu;
  }

  toJSON() {
    return {
      maDoiHang: this.maDoiHang,
      maDonHang: this.maDonHang,
      maKhachHang: this.maKhachHang,
      maChiTietSanPhamCu: this.maChiTietSanPhamCu,
      maChiTietSanPhamMoi: this.maChiTietSanPhamMoi,
      soLuong: this.soLuong,
      lyDo: this.lyDo,
      ngayYeuCau: this.ngayYeuCau,
      trangThai: this.trangThai,
      ghiChu: this.ghiChu
    };
  }
}

module.exports = DoiHang;
