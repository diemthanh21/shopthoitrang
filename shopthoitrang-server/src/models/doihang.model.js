class DoiHang {
  constructor({
    madoihang,
    madonhang,
    makhachhang,
    machitietsanphamcu,
    machitietsanphammoi,
    soluong,
    lydo,
    ngayyeucau,
    trangthai,
    ghichu,
    // extended fields
    giacu,
    giamoi,
    chenhlech,
    trangthaitien,
    phuongthuc_xuly_chenhlech,
    madonhangmoi,
    ngaytaodonmoi,
    diachiguihang,
    huongdan_donggoi,
    ngayduyet,
    ngaynhanhangcu,
    ngaykiemtra,
    trangthaikiemtra,
    voucher_code,
    voucher_amount
  }) {
    this.madoihang = madoihang;
    this.madonhang = madonhang;
    this.makhachhang = makhachhang;
    this.machitietsanphamcu = machitietsanphamcu;
    this.machitietsanphammoi = machitietsanphammoi;
    this.soluong = soluong;
    this.lydo = lydo;
    this.ngayyeucau = ngayyeucau;
    this.trangthai = trangthai;
    this.ghichu = ghichu;
    this.giacu = giacu;
    this.giamoi = giamoi;
    this.chenhlech = chenhlech;
    this.trangthaitien = trangthaitien;
    this.phuongthuc_xuly_chenhlech = phuongthuc_xuly_chenhlech;
    this.madonhangmoi = madonhangmoi;
    this.ngaytaodonmoi = ngaytaodonmoi;
    this.diachiguihang = diachiguihang;
    this.huongdan_donggoi = huongdan_donggoi;
    this.ngayduyet = ngayduyet;
    this.ngaynhanhangcu = ngaynhanhangcu;
    this.ngaykiemtra = ngaykiemtra;
    this.trangthaikiemtra = trangthaikiemtra;
    this.voucher_code = voucher_code;
    this.voucher_amount = voucher_amount;
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = DoiHang;
