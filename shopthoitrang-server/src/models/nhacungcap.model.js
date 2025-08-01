// nhacungcap.model.js
class NhaCungCap {
  constructor({
    MANHACUNGCAP, TENNHACUNGCAP, THONGTINLIENHE
  }) {
    this.maNhaCungCap = MANHACUNGCAP;
    this.tenNhaCungCap = TENNHACUNGCAP;
    this.thongTinLienHe = THONGTINLIENHE;
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