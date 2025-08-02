class NoiDungChat {
  constructor({
    machat, machatbox, nguoigui, noidung, thoigiangui, daxem, ghichu
  }) {
    this.maChat = machat;
    this.maChatBox = machatbox;
    this.nguoiGui = nguoigui;
    this.noiDung = noidung;
    this.thoiGianGui = thoigiangui;
    this.daXem = daxem;
    this.ghiChu = ghichu;
  }

  toJSON() {
    return {
      machat: this.maChat,
      machatbox: this.maChatBox,
      nguoigui: this.nguoiGui,
      noidung: this.noiDung,
      thoigiangui: this.thoiGianGui,
      daxem: this.daXem,
      ghichu: this.ghiChu
    };
  }
}

module.exports = NoiDungChat;
