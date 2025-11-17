class SanPham {
  constructor({
    masanpham,
    tensanpham,
    madanhmuc,
    mathuonghieu,
    trangthai,
    hinhanh,
    bangsize,
  }) {
    this.maSanPham = masanpham;
    this.tenSanPham = tensanpham;
    this.maDanhMuc = madanhmuc;
    this.maThuongHieu = mathuonghieu;
    this.trangThai = trangthai;
    this.hinhAnh = hinhanh ?? null;
     this.bangSize = bangsize ?? null;
  }

  toJSON() {
    return {
      masanpham: this.maSanPham,
      tensanpham: this.tenSanPham,
      madanhmuc: this.maDanhMuc,
      mathuonghieu: this.maThuongHieu,
      trangthai: this.trangThai,
      hinhanh: this.hinhAnh,
      bangsize: this.bangSize,
    };
  }
}

module.exports = SanPham;
