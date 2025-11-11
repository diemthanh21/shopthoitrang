class TheThanhVien {
  constructor({
    mathe,
    makhachhang,
    mahangthe,
    ngaycap,
    ngayhethan,
    trangthai,
    tier_snapshot,
    tichluy_khi_cap
  }) {
    this.maThe = mathe;
    this.maKhachHang = makhachhang;
    this.maHangThe = mahangthe;
    this.ngayCap = ngaycap;
    this.ngayHetHan = ngayhethan;
    this.trangThai = trangthai;
    this.tierSnapshot = tier_snapshot || null;
    this.tichLuyKhiCap = Number(tichluy_khi_cap ?? 0);
  }

  toJSON() {
    return {
      mathe: this.maThe,
      makhachhang: this.maKhachHang,
      mahangthe: this.maHangThe,
      ngaycap: this.ngayCap,
      ngayhethan: this.ngayHetHan,
      trangthai: this.trangThai,
      tier_snapshot: this.tierSnapshot,
      tichluy_khi_cap: this.tichLuyKhiCap
    };
  }
}

module.exports = TheThanhVien;
