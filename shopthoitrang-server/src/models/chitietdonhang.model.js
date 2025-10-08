class ChiTietDonHang {
  constructor({ machitietdonhang, madonhang, machitietsanpham, soluong, dongia }) {
    this.machitietdonhang = machitietdonhang;
    this.madonhang = madonhang;
    this.machitietsanpham = machitietsanpham;
    this.soluong = soluong;
    this.dongia = dongia;
  }

  toJSON() {
    return {
      machitietdonhang: this.machitietdonhang,
      madonhang: this.madonhang,
      machitietsanpham: this.machitietsanpham,
      soluong: this.soluong,
      dongia: this.dongia
    };
  }
}

module.exports = ChiTietDonHang;
