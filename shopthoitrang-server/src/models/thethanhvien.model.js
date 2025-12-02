class TheThanhVien {
  constructor({
    mathe,
    makhachhang,
    ngaycap,
    trangthai,
    diem_hien_tai,
    diem_pending,
    diem_nam_hien_tai,
    nam_diem,
    last_reset_at,
    updated_at
  }) {
    this.maThe = mathe;
    this.maKhachHang = makhachhang;
    this.ngayCap = ngaycap;
    this.trangThai = trangthai;
    this.diemHienTai = Number(diem_hien_tai ?? 0);
    this.diemPending = Number(diem_pending ?? 0);
    this.diemNamHienTai = Number(diem_nam_hien_tai ?? 0);
    this.namDiem = Number(nam_diem ?? new Date().getFullYear());
    this.lastResetAt = last_reset_at;
    this.updatedAt = updated_at;
  }

  toJSON() {
    return {
      mathe: this.maThe,
      makhachhang: this.maKhachHang,
      ngaycap: this.ngayCap,
      trangthai: this.trangThai,
      diem_hien_tai: this.diemHienTai,
      diem_pending: this.diemPending,
      diem_nam_hien_tai: this.diemNamHienTai,
      nam_diem: this.namDiem,
      last_reset_at: this.lastResetAt,
      updated_at: this.updatedAt
    };
  }
}

module.exports = TheThanhVien;
