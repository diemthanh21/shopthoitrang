const ChiTietDoiHang = require('./chitietdoihang.model');

class DoiHang {
  constructor({
    madoihang,
    madonhang,
    makhachhang,
    lydo,
    ngayyeucau,
    trangthai,
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
    voucher_amount,
    chiTietDoiHang,
    chitietdoihang,
  }) {
    this.madoihang = madoihang;
    this.madonhang = madonhang;
    this.makhachhang = makhachhang;
    this.lydo = lydo;
    this.ngayyeucau = ngayyeucau;
    this.trangthai = trangthai;
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
    const detailRows = chitietdoihang || chiTietDoiHang || [];
    this.items = detailRows.map((row) =>
      row instanceof ChiTietDoiHang ? row : new ChiTietDoiHang(row)
    );
    const primary = this.items[0];
    this.machitietsanphamcu = primary?.machitietsanphamcu ?? null;
    this.machitietsanphammoi = primary?.machitietsanphammoi ?? null;
    this.soluong = primary?.soluong ?? null;
    this.variantCu = primary?.variantCu ?? null;
    this.variantMoi = primary?.variantMoi ?? null;
  }

  toJSON() {
    return {
      ...this,
      chitietdoihang: this.items.map((item) => item.toJSON()),
    };
  }
}

module.exports = DoiHang;
