// models/khuyenmai.model.js
class KhuyenMai {
  constructor({
    MAKHUYENMAI, TENCHUONGTRINH, LOAIKHUYENMAI, MASANPHAM,
    TYLEGIAM, MASANPHAMTANG, NGAYBATDAU, NGAYKETTHUC,
    MOTA, MANHANVIEN
  }) {
    this.maKhuyenMai = MAKHUYENMAI;
    this.tenChuongTrinh = TENCHUONGTRINH;
    this.loaiKhuyenMai = LOAIKHUYENMAI;
    this.maSanPham = MASANPHAM;
    this.tyLeGiam = TYLEGIAM;
    this.maSanPhamTang = MASANPHAMTANG;
    this.ngayBatDau = NGAYBATDAU;
    this.ngayKetThuc = NGAYKETTHUC;
    this.moTa = MOTA;
    this.maNhanVien = MANHANVIEN;
  }
}

module.exports = KhuyenMai;
