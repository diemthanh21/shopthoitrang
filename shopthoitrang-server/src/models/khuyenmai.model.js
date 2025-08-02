class KhuyenMai {
  constructor({
    makhuyenmai, tenchuongtrinh, loaikhuyenmai, masanpham,
    tylegiam, masanphamtang, ngaybatdau, ngayketthuc,
    mota, manhanvien
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
      maKhuyenMai: this.maKhuyenMai,
      tenChuongTrinh: this.tenChuongTrinh,
      loaiKhuyenMai: this.loaiKhuyenMai,
      maSanPham: this.maSanPham,
      tyLeGiam: this.tyLeGiam,
      maSanPhamTang: this.maSanPhamTang,
      ngayBatDau: this.ngayBatDau,
      ngayKetThuc: this.ngayKetThuc,
      moTa: this.moTa,
      maNhanVien: this.maNhanVien
    };
  }
}

module.exports = KhuyenMai;
