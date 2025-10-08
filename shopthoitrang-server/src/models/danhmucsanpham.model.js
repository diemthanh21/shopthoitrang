class DanhMucSanPham {
  constructor({ madanhmuc, tendanhmuc }) {
    this.madanhmuc = madanhmuc;
    this.tendanhmuc = tendanhmuc;
  }

  toJSON() {
    return {
      madanhmuc: this.madanhmuc,
      tendanhmuc: this.tendanhmuc,
    };
  }
}

module.exports = DanhMucSanPham;
