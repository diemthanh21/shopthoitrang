const parseIds = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((v) => Number(v))
          .filter((v) => Number.isFinite(v) && v > 0);
      }
    } catch (err) {
      // fallback to comma separated list
      return trimmed
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v) && v > 0);
    }
  }
  return [];
};

const toPositiveInt = (value, fallback = 1) => {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseVariantSelections = (value) => {
  if (!value) return [];

  let source = value;
  if (typeof value === 'string') {
    try {
      source = JSON.parse(value);
    } catch (err) {
      return [];
    }
  }

  if (!Array.isArray(source)) return [];

  return source
    .map((item) => {
      const variantId = Number(
        item.variantId ??
          item.maChiTietSanPham ??
          item.id ??
          item.variant_id
      );
      const productId = Number(
        item.productId ??
          item.maSanPham ??
          item.product_id ??
          item.masanpham
      );
      const quantity = toPositiveInt(
        item.quantity ?? item.soLuong ?? item.qty ?? item.quantityGift,
        0
      );
      const buyQty = toPositiveInt(
        item.buyQty ??
          item.soLuongMua ??
          item.so_luong_mua ??
          item.buy_qty ??
          item.quantityBuy,
        1
      );
      const giftQty = toPositiveInt(
        item.giftQty ??
          item.soLuongTang ??
          item.so_luong_tang ??
          item.gift_qty ??
          item.quantityGift,
        1
      );
      if (!Number.isFinite(variantId) || variantId <= 0) return null;
      if (!Number.isFinite(quantity) || quantity <= 0) return null;
      const sizeId = Number(item.sizeId ?? item.kichThuocId ?? item.size_id);
      return {
        productId: Number.isFinite(productId) && productId > 0 ? productId : null,
        variantId,
        sizeId: Number.isFinite(sizeId) && sizeId > 0 ? sizeId : null,
        quantity,
        buyQty,
        giftQty,
      };
    })
    .filter(Boolean);
};

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
    manhanvien,
    sanpham_apdung_ids,
    sanpham_tang_ids,
    sanpham_tang_variants,
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
    this.sanPhamApDungIds = parseIds(sanpham_apdung_ids);
    this.sanPhamTangIds = parseIds(sanpham_tang_ids);
    this.sanPhamTangVariants = parseVariantSelections(sanpham_tang_variants);
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
      manhanvien: this.maNhanVien,
      sanpham_apdung_ids: this.sanPhamApDungIds,
      sanpham_tang_ids: this.sanPhamTangIds,
      sanpham_tang_variants: this.sanPhamTangVariants,
    };
  }
}

module.exports = KhuyenMai;
