class SanPham {
  constructor({
    masanpham,
    tensanpham,
    madanhmuc,
    mathuonghieu,
    trangthai
  }) {
    this.maSanPham = masanpham;
    this.tenSanPham = tensanpham;
    this.maDanhMuc = madanhmuc;
    this.maThuongHieu = mathuonghieu;
    this.trangThai = trangthai;
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
