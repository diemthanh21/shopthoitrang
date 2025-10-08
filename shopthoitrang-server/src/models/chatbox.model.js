class ChatBox {
  constructor({ machatbox, makhachhang, manhanvien, ngaytao, trangthai }) {
    this.machatbox = machatbox;
    this.makhachhang = makhachhang;
    this.manhanvien = manhanvien;
    this.ngaytao = ngaytao;
    this.trangthai = trangthai || 'Đang hoạt động';
  }

  toJSON() {
    return {
      machatbox: this.machatbox,
      makhachhang: this.makhachhang,
      manhanvien: this.manhanvien,
      ngaytao: this.ngaytao,
      trangthai: this.trangthai,
    };
  }
}

module.exports = ChatBox;
