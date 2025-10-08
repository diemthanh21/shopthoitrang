class NhaCungCap {
  constructor({
    manhacungcap,
    tennhacungcap,
    thongtinlienhe
  }) {
    this.maNhaCungCap = manhacungcap;
    this.tenNhaCungCap = tennhacungcap;
    this.thongTinLienHe = thongtinlienhe;
  }

  toJSON() {
    return {
      manhacungcap: this.maNhaCungCap,
      tennhacungcap: this.tenNhaCungCap,
      thongtinlienhe: this.thongTinLienHe
    };
  }
}

module.exports = NhaCungCap;
