class ChotCa {
  constructor({
    machotca,
    maphancong,
    manhanvien,
    maca,
    ngaychotca,
    giobatdau,
    gioketthuc,
    tongthu,
    tongchi,
    tienmat,
    tienchuyenkhoan,
    soluongdonhang,
    chenhlechtienmat,
    ghichu,
    nguoiduyet,
    ngayduyet,
    trangthai,
  }) {
    Object.assign(this, {
      machotca,
      maphancong,
      manhanvien,
      maca,
      ngaychotca,
      giobatdau,
      gioketthuc,
      tongthu,
      tongchi,
      tienmat,
      tienchuyenkhoan,
      soluongdonhang,
      chenhlechtienmat,
      ghichu,
      nguoiduyet,
      ngayduyet,
      trangthai,
    });
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = ChotCa;
