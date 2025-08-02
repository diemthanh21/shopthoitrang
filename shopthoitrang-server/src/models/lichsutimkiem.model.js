class LichSuTimKiem {
  constructor({
    malichsu, makhachhang, machitietsanpham, noidung, 
    thoigiantk, matukhoa
  }) {
    this.maLichSu = malichsu;
    this.maKhachHang = makhachhang;
    this.maChiTietSanPham = machitietsanpham;
    this.noiDung = noidung;
    this.thoiGianTK = thoigiantk;
    this.maTuKhoa = matukhoa;
  }

  toJSON() {
    return {
      maLichSu: this.maLichSu,
      maKhachHang: this.maKhachHang,
      maChiTietSanPham: this.maChiTietSanPham,
      noiDung: this.noiDung,
      thoiGianTK: this.thoiGianTK,
      maTuKhoa: this.maTuKhoa
    };
  }
}

module.exports = LichSuTimKiem;
