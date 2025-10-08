class NoiDungChat {
  constructor({
    machat,
    machatbox,
    nguoigui,
    noidung,
    thoigiangui,
    daxem
  }) {
    this.maChat = machat;
    this.maChatBox = machatbox;
    this.nguoiGui = nguoigui;           // 'KH' | 'NV'
    this.noiDung = noidung;
    this.thoiGianGui = thoigiangui;     // ISO datetime
    this.daXem = daxem;                 // boolean
  }

  toJSON() {
    return {
      machat: this.maChat,
      machatbox: this.maChatBox,
      nguoigui: this.nguoiGui,
      noidung: this.noiDung,
      thoigiangui: this.thoiGianGui,
      daxem: this.daXem
    };
  }
}

module.exports = NoiDungChat;
