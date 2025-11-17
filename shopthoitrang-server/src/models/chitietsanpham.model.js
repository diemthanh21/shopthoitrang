const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeSizes = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const sizeRow = row?.kichthuocs || {};
      const tenKichThuoc =
        row?.tenKichThuoc ??
        row?.ten_kichthuoc ??
        sizeRow?.ten_kichthuoc ??
        null;
      return {
        id: row?.id ?? row?.machitietsanpham_kichthuoc ?? row?.bridgeId ?? null,
        maKichThuoc:
          row?.maKichThuoc ??
          row?.makichthuoc ??
          sizeRow?.makichthuoc ??
          null,
        tenKichThuoc,
        moTa: row?.moTa ?? row?.mo_ta ?? sizeRow?.mo_ta ?? null,
        soLuong: toNumber(row?.soLuong ?? row?.so_luong, 0),
        giaThem: toNumber(row?.giaThem ?? row?.gia_them, 0),
      };
    })
    .filter((s) => !!s.maKichThuoc || !!s.tenKichThuoc);
};

const normalizeImages = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((img) => ({
      mahinhanh:
        img?.mahinhanh ??
        img?.maHinhAnh ??
        img?.id ??
        img?.MAHINHANH ??
        null,
      machitietsanpham:
        img?.machitietsanpham ??
        img?.maChiTietSanPham ??
        img?.MACHITIETSANPHAM ??
        null,
      duongdanhinhanh:
        img?.duongdanhinhanh ??
        img?.duongDanHinhAnh ??
        img?.DUONGDANHINHANH ??
        "",
    }))
    .filter((img) => !!img.duongdanhinhanh);
};

class ChiTietSanPham {
  constructor({
    machitietsanpham,
    masanpham,
    kichthuoc,
    mausac,
    chatlieu,
    mota,
    giaban,
    soluongton,
    sizes,
    chitietsanpham_kichthuoc,
    hinhanhsanpham,
  }) {
    this.machitietsanpham = machitietsanpham;
    this.masanpham = masanpham;
    this.sizes = normalizeSizes(sizes || chitietsanpham_kichthuoc || []);
    const primarySize = this.sizes.length ? this.sizes[0].tenKichThuoc : null;
    this.kichthuoc = kichthuoc ?? primarySize ?? null;
    this.mausac = mausac ?? null;
    this.chatlieu = chatlieu ?? null;
    this.mota = mota ?? null;
    this.giaban = giaban;
    this.soluongton = soluongton ?? 0;
    this.hinhanhsanpham = normalizeImages(hinhanhsanpham);
  }

  toJSON() {
    return {
      machitietsanpham: this.machitietsanpham,
      masanpham: this.masanpham,
      kichthuoc: this.kichthuoc,
      mausac: this.mausac,
      chatlieu: this.chatlieu,
      mota: this.mota,
      giaban: this.giaban,
      soluongton: this.soluongton,
      sizes: this.sizes,
      hinhanhsanpham: this.hinhanhsanpham,
    };
  }
}

module.exports = ChiTietSanPham;
