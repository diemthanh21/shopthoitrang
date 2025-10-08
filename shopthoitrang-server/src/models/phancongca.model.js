class PhanCongCa {
  constructor({
    maphancong,
    manhanvien,
    maca,
    ngaylamviec,
    trangthai,
    ghichu,
    nguoiphancong,
    ngayphancong
  }) {
    this.maPhanCong = maphancong;
    this.maNhanVien = manhanvien;
    this.maCa = maca;
    this.ngayLamViec = ngaylamviec;     // DATE (YYYY-MM-DD)
    this.trangThai = trangthai;         // 'Đã phân công' / 'Đã hoàn thành' / 'Vắng mặt'
    this.ghiChu = ghichu;
    this.nguoiPhanCong = nguoiphancong; // mã NV quản lý
    this.ngayPhanCong = ngayphancong;   // TIMESTAMP
  }

  toJSON() {
    return {
      maphancong: this.maPhanCong,
      manhanvien: this.maNhanVien,
      maca: this.maCa,
      ngaylamviec: this.ngayLamViec,
      trangthai: this.trangThai,
      ghichu: this.ghiChu,
      nguoiphancong: this.nguoiPhanCong,
      ngayphancong: this.ngayPhanCong
    };
  }
}

module.exports = PhanCongCa;
