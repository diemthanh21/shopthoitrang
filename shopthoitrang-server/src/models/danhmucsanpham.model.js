class DanhMucSanPham {
  constructor({ madanhmuc, tendanhmuc }) {
    this.maDanhMuc = madanhmuc;
    this.tenDanhMuc = tendanhmuc;
  }

  toJSON() {
    return {
      maDanhMuc: this.maDanhMuc,
      tenDanhMuc: this.tenDanhMuc
    };
  }
}

module.exports = DanhMucSanPham;
