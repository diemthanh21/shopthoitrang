// src/models/magiamgia.model.js
class MaGiamGia {
  constructor({
    mavoucher,
    macode,
    tenmagiamgia,
    madonhang,
    mota,
    giatrigiam,
    soluong,
    ngaybatdau,
    ngayketthuc,
    manhanvien,
    // Các field mới
    maloaivoucher,
    hinhthuc_giam,
    phantram_giam,
    sotien_giam,
    giam_toi_da,
    dieukien_don_toi_thieu,
    soluong_da_dung,
    chi_ap_dung_sinhnhat,
    created_at,
    updated_at,
  }) {
    // Cột cũ
    this.maVoucher = mavoucher;
    this.maCode = macode;
    this.tenMaGiamGia = tenmagiamgia;
    this.maDonHang = madonhang;
    this.moTa = mota;
    this.giaTriGiam = giatrigiam; // alias cho giảm tiền cố định (OLD)
    this.soLuong = soluong;
    this.ngayBatDau = ngaybatdau;
    this.ngayKetThuc = ngayketthuc;
    this.maNhanVien = manhanvien;

    // Cột mới
    this.maLoaiVoucher = maloaivoucher;
    this.hinhThucGiam = hinhthuc_giam; // AMOUNT | PERCENT | FREESHIP
    this.phanTramGiam = phantram_giam;
    this.soTienGiam = sotien_giam;
    this.giamToiDa = giam_toi_da;
    this.dieuKienDonToiThieu = dieukien_don_toi_thieu;
    this.soLuongDaDung = soluong_da_dung;
    this.chiApDungSinhNhat = chi_ap_dung_sinhnhat;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }

  toJSON() {
    return {
      mavoucher: this.maVoucher,
      macode: this.maCode,
      tenmagiamgia: this.tenMaGiamGia,
      madonhang: this.maDonHang,
      mota: this.moTa,
      giatrigiam: this.giaTriGiam,
      soluong: this.soLuong,
      ngaybatdau: this.ngayBatDau,
      ngayketthuc: this.ngayKetThuc,
      manhanvien: this.maNhanVien,

      maloaivoucher: this.maLoaiVoucher,
      hinhthuc_giam: this.hinhThucGiam,
      phantram_giam: this.phanTramGiam,
      sotien_giam: this.soTienGiam,
      giam_toi_da: this.giamToiDa,
      dieukien_don_toi_thieu: this.dieuKienDonToiThieu,
      soluong_da_dung: this.soLuongDaDung,
      chi_ap_dung_sinhnhat: this.chiApDungSinhNhat,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}

module.exports = MaGiamGia;
