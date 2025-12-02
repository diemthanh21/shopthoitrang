class ChiTietDonHang {
  constructor({ machitietdonhang, madonhang, machitietsanpham, soluong, dongia, chitietsize_id }) {
    this.machitietdonhang = machitietdonhang;
    this.madonhang = madonhang;
    this.machitietsanpham = machitietsanpham;
    this.soluong = soluong;
    this.dongia = dongia;
    this.chitietsize_id = chitietsize_id ?? null;
  }

  toJSON() {
    return {
      machitietdonhang: this.machitietdonhang,
      madonhang: this.madonhang,
      machitietsanpham: this.machitietsanpham,
      soluong: this.soluong,
      dongia: this.dongia,
      chitietsize_id: this.chitietsize_id
    };
  }
}

module.exports = ChiTietDonHang;
