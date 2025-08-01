// chitietsanpham.model.js
class ChiTietSanPham {
  constructor({
    MACHITIETSANPHAM, MASANPHAM, KICHTHUOC, MAUSAC, CHATLIEU,
    MOTA, GIABAN, SOLUONGTON
  }) {
    this.maChiTietSanPham = MACHITIETSANPHAM;
    this.maSanPham = MASANPHAM;
    this.kichThuoc = KICHTHUOC;
    this.mauSac = MAUSAC;
    this.chatLieu = CHATLIEU;
    this.moTa = MOTA;
    this.giaBan = GIABAN;
    this.soLuongTon = SOLUONGTON;
  }

  toJSON() {
    return {
      maChiTietSanPham: this.maChiTietSanPham,
      maSanPham: this.maSanPham,
      kichThuoc: this.kichThuoc,
      mauSac: this.mauSac,
      chatLieu: this.chatLieu,
      moTa: this.moTa,
      giaBan: this.giaBan,
      soLuongTon: this.soLuongTon
    };
  }
}

module.exports = ChiTietSanPham;