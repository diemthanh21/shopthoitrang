class KhuyenMai {
  constructor({
    makhuyenmai,
    tenchuongtrinh,
    loaikhuyenmai,
    masanpham,
    tylegiam,
    masanphamtang,
    ngaybatdau,
    ngayketthuc,
    mota,
    manhanvien
  }) {
    this.maKhuyenMai = makhuyenmai;
    this.tenChuongTrinh = tenchuongtrinh;
    this.loaiKhuyenMai = loaikhuyenmai;
    this.maSanPham = masanpham;
    this.tyLeGiam = tylegiam;
    this.maSanPhamTang = masanphamtang;
    this.ngayBatDau = ngaybatdau;
    this.ngayKetThuc = ngayketthuc;
    this.moTa = mota;
    this.maNhanVien = manhanvien;
  }

  toJSON() {
    return {
      makhuyenmai: this.maKhuyenMai,
      tenchuongtrinh: this.tenChuongTrinh,
      loaikhuyenmai: this.loaiKhuyenMai,
      masanpham: this.maSanPham,
      tylegiam: this.tyLeGiam,
      masanphamtang: this.maSanPhamTang,
      ngaybatdau: this.ngayBatDau,
      ngayketthuc: this.ngayKetThuc,
      mota: this.moTa,
      manhanvien: this.maNhanVien
    };
  }
}

module.exports = KhuyenMai;
