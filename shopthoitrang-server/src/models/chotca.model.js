class ChotCa {
  constructor({
    machotca,
    manhanvien,
    ngaychotca,
    tongthu,
    tienmat,
    tienchi,
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
      manhanvien,
      ngaychotca,
      tongthu,
      tienmat,
      tienchi,
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
