class TheThanhVien {
  constructor({
    mathe,
    makhachhang,
    mahangthe,
    ngaycap,
    ngayhethan,
    trangthai
  }) {
    this.maThe = mathe;
    this.maKhachHang = makhachhang;
    this.maHangThe = mahangthe;
    this.ngayCap = ngaycap;
    this.ngayHetHan = ngayhethan;
    this.trangThai = trangthai;
  }

  toJSON() {
    return {
      mathe: this.maThe,
      makhachhang: this.maKhachHang,
      mahangthe: this.maHangThe,
      ngaycap: this.ngayCap,
      ngayhethan: this.ngayHetHan,
      trangthai: this.trangThai
    };
  }
}

module.exports = TheThanhVien;
