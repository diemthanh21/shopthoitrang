class ChiTietPhieuDatHang {
  constructor({
    machitietphieudathang,
    maphieudathang,
    machitietsanpham,
    soluong,
    dongia,
    thanhtien,
    ghichu
  }) {
    this.machitietphieudathang = machitietphieudathang;
    this.maphieudathang = maphieudathang;
    this.machitietsanpham = machitietsanpham;
    this.soluong = soluong;
    this.dongia = dongia;
    this.thanhtien = thanhtien;
    this.ghichu = ghichu;
  }

  toJSON() {
    return {
      machitietphieudathang: this.machitietphieudathang,
      maphieudathang: this.maphieudathang,
      machitietsanpham: this.machitietsanpham,
      soluong: this.soluong,
      dongia: this.dongia,
      thanhtien: this.thanhtien,
      ghichu: this.ghichu,
    };
  }
}

module.exports = ChiTietPhieuDatHang;
