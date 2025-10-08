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
      masanpham: this.maSanPham,
      tensanpham: this.tenSanPham,
      madanhmuc: this.maDanhMuc,
      mathuonghieu: this.maThuongHieu,
      trangthai: this.trangThai
    };
  }
}

module.exports = SanPham;
