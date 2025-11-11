class NoiDungChat {
  constructor({
    machat,
    machatbox,
    nguoigui,
    noidung,
    thoigiangui,
    daxem,
    manhanvien,
    message_type,
    product_snapshot
  }) {
    this.maChat = machat;
    this.maChatBox = machatbox;
    this.nguoiGui = nguoigui;           // 'KH' | 'NV'
    this.noiDung = noidung;
    this.thoiGianGui = thoigiangui;     // ISO datetime
    this.daXem = daxem;                 // boolean
    this.maNhanVien = manhanvien || null;
    this.messageType = message_type || 'text'; // 'text' | 'product' | future types
    this.productSnapshot = product_snapshot || null; // JSON object when message_type = 'product'
  }

  toJSON() {
    return {
      machat: this.maChat,
      machatbox: this.maChatBox,
      nguoigui: this.nguoiGui,
      noidung: this.noiDung,
      thoigiangui: this.thoiGianGui,
      daxem: this.daXem,
      manhanvien: this.maNhanVien,
      message_type: this.messageType,
      product_snapshot: this.productSnapshot
    };
  }
}

module.exports = NoiDungChat;
