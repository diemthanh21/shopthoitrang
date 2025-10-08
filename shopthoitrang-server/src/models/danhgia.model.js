class DanhGia {
  constructor({
    madanhgia,
    masanpham,
    makhachhang,
    manhanvien,
    machitietdonhang,
    diemdanhgia,
    binhluan,
    hinhanh,
    phanhoitushop,
    ngaydanhgia,
  }) {
    Object.assign(this, {
      madanhgia,
      masanpham,
      makhachhang,
      manhanvien,
      machitietdonhang,
      diemdanhgia,
      binhluan,
      hinhanh,
      phanhoitushop,
      ngaydanhgia,
    });
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = DanhGia;
