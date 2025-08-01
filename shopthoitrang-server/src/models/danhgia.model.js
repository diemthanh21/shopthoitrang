// danhgia.model.js
class DanhGia {
  constructor({
    MADANHGIA, MASANPHAM, MAKHACHHANG, MANHANVIEN,
    MACHITIETDONHANG, DIEMDANHGIA, BINHLUAN, HINHANH,
    PHANHOITUSHOP, NGAYDANHGIA
  }) {
    this.maDanhGia = MADANHGIA;
    this.maSanPham = MASANPHAM;
    this.maKhachHang = MAKHACHHANG;
    this.maNhanVien = MANHANVIEN;
    this.maChiTietDonHang = MACHITIETDONHANG;
    this.diemDanhGia = DIEMDANHGIA;
    this.binhLuan = BINHLUAN;
    this.hinhAnh = HINHANH;
    this.phanHoiTuShop = PHANHOITUSHOP;
    this.ngayDanhGia = NGAYDANHGIA;
  }
}

module.exports = DanhGia;
