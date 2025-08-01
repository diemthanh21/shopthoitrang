class DoiHang {
  constructor({ MADOIHANG, MADONHANG, MAKHACHHANG, MACHITIETSANPHAMCU, MACHITIETSANPHAMMOI, SOLUONG, LYDO, NGAYYEUCAU, TRANGTHAI, GHICHU }) {
    this.maDoiHang = MADOIHANG;
    this.maDonHang = MADONHANG;
    this.maKhachHang = MAKHACHHANG;
    this.maChiTietSanPhamCu = MACHITIETSANPHAMCU;
    this.maChiTietSanPhamMoi = MACHITIETSANPHAMMOI;
    this.soLuong = SOLUONG;
    this.lyDo = LYDO;
    this.ngayYeuCau = NGAYYEUCAU;
    this.trangThai = TRANGTHAI;
    this.ghiChu = GHICHU;
  }
}
module.exports = DoiHang;
