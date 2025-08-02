class DanhGia {
  constructor({
    madanhgia, masanpham, makhachhang, manhanvien,
    machitietdonhang, diemdanhgia, binhluan, hinhanh,
    phanhoitushop, ngaydanhgia
  }) {
    this.maDanhGia = madanhgia;
    this.maSanPham = masanpham;
    this.maKhachHang = makhachhang;
    this.maNhanVien = manhanvien;
    this.maChiTietDonHang = machitietdonhang;
    this.diemDanhGia = diemdanhgia;
    this.binhLuan = binhluan;
    this.hinhAnh = hinhanh;
    this.phanHoiTuShop = phanhoitushop;
    this.ngayDanhGia = ngaydanhgia;
  }

  toJSON() {
    return {
      maDanhGia: this.maDanhGia,
      maSanPham: this.maSanPham,
      maKhachHang: this.maKhachHang,
      maNhanVien: this.maNhanVien,
      maChiTietDonHang: this.maChiTietDonHang,
      diemDanhGia: this.diemDanhGia,
      binhLuan: this.binhLuan,
      hinhAnh: this.hinhAnh,
      phanHoiTuShop: this.phanHoiTuShop,
      ngayDanhGia: this.ngayDanhGia
    };
  }
} 

module.exports = DanhGia;
