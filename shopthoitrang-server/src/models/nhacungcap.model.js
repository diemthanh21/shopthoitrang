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
      maNhaCungCap: this.maNhaCungCap,
      tenNhaCungCap: this.tenNhaCungCap,
      thongTinLienHe: this.thongTinLienHe
    };
  }
}

module.exports = NhaCungCap;
