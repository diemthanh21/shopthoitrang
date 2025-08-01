// lichsutimkiem.model.js
class LichSuTimKiem {
  constructor({
    MALICHSU, MAKHACHHANG, MACHITIETSANPHAM, NOIDUNG, 
    THOIGIANTK, MATUKHOA
  }) {
    this.maLichSu = MALICHSU;
    this.maKhachHang = MAKHACHHANG;
    this.maChiTietSanPham = MACHITIETSANPHAM;
    this.noiDung = NOIDUNG;
    this.thoiGianTK = THOIGIANTK;
    this.maTuKhoa = MATUKHOA;
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