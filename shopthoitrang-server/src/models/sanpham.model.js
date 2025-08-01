// sanpham.model.js
class SanPham {
  constructor({
    MASANPHAM, TENSANPHAM, MADANHMUC, MATHUONGHIEU, TRANGTHAI
  }) {
    this.maSanPham = MASANPHAM;
    this.tenSanPham = TENSANPHAM;
    this.maDanhMuc = MADANHMUC;
    this.maThuongHieu = MATHUONGHIEU;
    this.trangThai = TRANGTHAI;
  }

  toJSON() {
    return {
      maSanPham: this.maSanPham,
      tenSanPham: this.tenSanPham,
      maDanhMuc: this.maDanhMuc,
      maThuongHieu: this.maThuongHieu,
      trangThai: this.trangThai
    };
  }
}

module.exports = SanPham;