// src/models/ChiTietSanPhamSize.js

class ChiTietSanPhamSize {
  constructor({
    id,
    machitietsanpham,
    makichthuoc,
    so_luong
  }) {
    this.id = Number(id) || undefined;
    this.maChiTietSanPham = Number(machitietsanpham);
    this.maKichThuoc = Number(makichthuoc);
    this.soLuong = Number(so_luong ?? 0);
  }

  toRow() {
    return {
      id: this.id,
      machitietsanpham: this.maChiTietSanPham,
      makichthuoc: this.maKichThuoc,
      so_luong: this.soLuong
    };
  }
}

module.exports = ChiTietSanPhamSize;
