class ChatBox {
  constructor({
    machatbox,
    makhachhang,
    manhanvien,
    ngaytao,
    trangthai
  }) {
    this.maChatBox = machatbox;
    this.maKhachHang = makhachhang;
    this.maNhanVien = manhanvien;
    this.ngayTao = ngaytao;
    this.trangThai = trangthai;
  }

  toJSON() {
    return {
      maChatBox: this.maChatBox,
      maKhachHang: this.maKhachHang,
      maNhanVien: this.maNhanVien,
      ngayTao: this.ngayTao,
      trangThai: this.trangThai
    };
  }
}

module.exports = ChatBox;
