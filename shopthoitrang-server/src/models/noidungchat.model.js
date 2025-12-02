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
    product_snapshot,
    anhchat,
    videochat
  }) {
    this.maChat = machat;
    this.maChatBox = machatbox;
    this.nguoiGui = nguoigui;           // 'KH' | 'NV'
    this.noiDung = noidung;
    this.thoiGianGui = thoigiangui;     // ISO datetime
    this.daXem = daxem;                 // boolean
    this.maNhanVien = manhanvien || null;
    this.messageType = message_type || 'text'; // 'text' | 'product' | 'image' | 'video' | future types
    this.productSnapshot = product_snapshot || null; // JSON object when message_type = 'product'
    this.anhChat = anhchat || null;     // Image URL when message_type = 'image'
    this.videoChat = videochat || null; // Video URL when message_type = 'video'
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
      product_snapshot: this.productSnapshot,
      anhchat: this.anhChat,
      videochat: this.videoChat
    };
  }
}

module.exports = NoiDungChat;
