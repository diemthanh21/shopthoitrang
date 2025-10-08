class TichLuyChiTieu {
  constructor({
    id,
    makh,
    nam,
    tongchi_nam,
    tongchi_tichluy,
    ngaycapnhat
  }) {
    this.id = id;
    this.maKhachHang = makh;
    this.nam = nam;
    this.tongChiNam = tongchi_nam;
    this.tongChiTichLuy = tongchi_tichluy;
    this.ngayCapNhat = ngaycapnhat;
  }

  toJSON() {
    return {
      id: this.id,
      makh: this.maKhachHang,
      nam: this.nam,
      tongchi_nam: this.tongChiNam,
      tongchi_tichluy: this.tongChiTichLuy,
      ngaycapnhat: this.ngayCapNhat
    };
  }
}

module.exports = TichLuyChiTieu;
