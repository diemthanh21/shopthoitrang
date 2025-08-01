// danhmucsanpham.model.js
class DanhMucSanPham {
  constructor({
    MADANHMUC, TENDANHMUC
  }) {
    this.maDanhMuc = MADANHMUC;
    this.tenDanhMuc = TENDANHMUC;
  }

  toJSON() {
    return {
      maDanhMuc: this.maDanhMuc,
      tenDanhMuc: this.tenDanhMuc
    };
  }
}

module.exports = DanhMucSanPham;