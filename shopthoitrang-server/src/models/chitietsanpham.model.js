class ChiTietSanPham {
  constructor({
    machitietsanpham, masanpham, kichthuoc, mausac, chatlieu,
    mota, giaban, soluongton
  }) {
    this.maChiTietSanPham = machitietsanpham;
    this.maSanPham = masanpham;
    this.kichThuoc = kichthuoc;
    this.mauSac = mausac;
    this.chatLieu = chatlieu;
    this.moTa = mota;
    this.giaBan = giaban;
    this.soLuongTon = soluongton;
  }

  toJSON() {
    return {
      machitietsanpham: this.maChiTietSanPham,
      masanpham: this.maSanPham,
      kichthuoc: this.kichThuoc,
      mausac: this.mauSac,
      chatlieu: this.chatLieu,
      mota: this.moTa,
      giaban: this.giaBan,
      soluongton: this.soLuongTon
    };
  }
}

module.exports = ChiTietSanPham;
