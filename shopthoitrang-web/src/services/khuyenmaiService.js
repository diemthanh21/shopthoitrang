import api from "./api";

const parseIdList = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v));
      }
    } catch (err) {
      return trimmed
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);
    }
  }
  if (value != null) return [String(value)];
  return [];
};

const toPositiveInt = (value, fallback = 1) => {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseVariantSelections = (value) => {
  if (!value) return [];
  let source = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      source = JSON.parse(trimmed);
    } catch (err) {
      return [];
    }
  }
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      const productId =
        item?.productId ??
        item?.maSanPham ??
        item?.product_id ??
        item?.masanpham ??
        null;
      const variantId =
        item?.variantId ??
        item?.maChiTietSanPham ??
        item?.id ??
        item?.variant_id;
      const rawSize =
        item?.sizeId ??
        item?.kichThuocId ??
        item?.size_id ??
        item?.machitietsanpham_kichthuoc ??
        item?.bridgeId ??
        null;
      const normalizedSize =
        rawSize === undefined ||
        rawSize === null ||
        rawSize === "null" ||
        rawSize === ""
          ? null
          : String(rawSize);
      const quantity = toPositiveInt(
        item?.quantity ?? item?.soLuong ?? item?.qty ?? item?.quantityGift,
        0
      );
      const buyQty = toPositiveInt(
        item?.buyQty ??
          item?.soLuongMua ??
          item?.so_luong_mua ??
          item?.buy_qty ??
          item?.quantityBuy,
        1
      );
      const giftQty = toPositiveInt(
        item?.giftQty ??
          item?.soLuongTang ??
          item?.so_luong_tang ??
          item?.gift_qty ??
          item?.quantityGift,
        1
      );
      if (!variantId || quantity <= 0) return null;
      return {
        productId: productId ? String(productId) : null,
        variantId: String(variantId),
        sizeId: normalizedSize,
        quantity,
        buyQty,
        giftQty,
      };
    })
    .filter(Boolean);
};

const normalize = (record = {}) => ({
  maKhuyenMai: record.makhuyenmai ?? record.maKhuyenMai ?? record.id,
  tenChuongTrinh: record.tenchuongtrinh ?? record.tenChuongTrinh ?? "",
  loaiKhuyenMai:
    ((record.loaikhuyenmai ?? record.loaiKhuyenMai ?? "") || "GIAM_PERCENT")
      .toString()
      .toUpperCase(),
  maSanPham: record.masanpham ?? record.maSanPham ?? null,
  tyLeGiam: record.tylegiam ?? record.tyLeGiam ?? 0,
  maSanPhamTang: record.masanphamtang ?? record.maSanPhamTang ?? null,
  ngayBatDau: record.ngaybatdau ?? record.ngayBatDau ?? null,
  ngayKetThuc: record.ngayketthuc ?? record.ngayKetThuc ?? null,
  moTa: record.mota ?? record.moTa ?? "",
  maNhanVien: record.manhanvien ?? record.maNhanVien ?? null,
  sanPhamApDungIds: parseIdList(
    record.sanpham_apdung_ids ??
      record.sanPhamApDungIds ??
      record.dsSanPhamApDung
  ),
  sanPhamTangIds: parseIdList(
    record.sanpham_tang_ids ??
      record.sanPhamTangIds ??
      record.dsSanPhamTang
  ),
  sanPhamTangVariants: parseVariantSelections(
    record.sanpham_tang_variants ?? record.sanPhamTangVariants ?? []
  ),
});

const toNumberArray = (value = []) => {
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => Number(item))
    .filter((num) => Number.isFinite(num) && num > 0);
};

const toDB = (payload = {}) => {
  const applyIds = toNumberArray(
    payload.sanPhamApDungIds ??
      payload.sanpham_apdung_ids ??
      payload.dsSanPhamApDung ??
      []
  );
  const giftIds = toNumberArray(
    payload.sanPhamTangIds ??
      payload.sanpham_tang_ids ??
      payload.dsSanPhamTang ??
      []
  );

  const variantSelections = Array.isArray(payload.sanPhamTangVariants)
    ? payload.sanPhamTangVariants
        .map((item) => {
          const variantId = Number(
            item.variantId ??
              item.maChiTietSanPham ??
              item.id ??
              item.variant_id
          );
          if (!Number.isFinite(variantId) || variantId <= 0) return null;
          const productId = Number(
            item.productId ??
              item.maSanPham ??
              item.product_id ??
              item.masanpham
          );
          const rawSize =
            item.sizeId ??
            item.kichThuocId ??
            item.size_id ??
            item.machitietsanpham_kichthuoc ??
            item.bridgeId ??
            null;
          const normalizedSize =
            rawSize === undefined ||
            rawSize === null ||
            rawSize === "null" ||
            rawSize === ""
              ? null
              : Number(rawSize);
          const quantity = toPositiveInt(
            item.quantity ?? item.soLuong ?? item.qty ?? item.quantityGift,
            0
          );
          if (!Number.isFinite(quantity) || quantity <= 0) return null;
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
          return {
            productId:
              Number.isFinite(productId) && productId > 0 ? productId : null,
            variantId,
            sizeId:
              Number.isFinite(normalizedSize) && normalizedSize > 0
                ? normalizedSize
                : null,
            buyQty,
            giftQty,
            quantity,
          };
        })
        .filter(Boolean)
    : [];

  const resolvedLoai =
    ((payload.loaiKhuyenMai ?? payload.loaikhuyenmai) || "GIAM_PERCENT")
      .toString()
      .toUpperCase();
  const resolvedApplyProductId =
    payload.maSanPham ?? payload.masanpham ?? applyIds[0] ?? null;
  const resolvedGiftProductId =
    payload.maSanPhamTang ?? payload.masanphamtang ?? giftIds[0] ?? null;
  const resolvedTyLeRaw =
    payload.tyLeGiam ?? payload.tylegiam ?? payload.ty_le_giam ?? null;
  const resolvedMaNhanVienRaw =
    payload.maNhanVien ?? payload.manhanvien ?? null;

  const masanpham =
    resolvedApplyProductId !== null && resolvedApplyProductId !== undefined
      ? Number(resolvedApplyProductId)
      : null;
  const masanphamtang =
    resolvedGiftProductId !== null && resolvedGiftProductId !== undefined
      ? Number(resolvedGiftProductId)
      : null;
  const manhanvien =
    resolvedMaNhanVienRaw !== null && resolvedMaNhanVienRaw !== undefined
      ? Number(resolvedMaNhanVienRaw)
      : null;
  const tylegiam =
    resolvedLoai === "GIAM_PERCENT" && resolvedTyLeRaw !== null && resolvedTyLeRaw !== undefined
      ? Number(resolvedTyLeRaw)
      : null;

  return {
    makhuyenmai: payload.maKhuyenMai ?? payload.makhuyenmai ?? undefined,
    tenchuongtrinh: payload.tenChuongTrinh ?? payload.tenchuongtrinh ?? "",
    loaikhuyenmai: resolvedLoai,
    masanpham,
    tylegiam,
    masanphamtang,
    ngaybatdau: payload.ngayBatDau ?? payload.ngaybatdau ?? null,
    ngayketthuc: payload.ngayKetThuc ?? payload.ngayketthuc ?? null,
    mota: payload.moTa ?? payload.mota ?? null,
    manhanvien,
    sanpham_apdung_ids: applyIds,
    sanpham_tang_ids: giftIds,
    sanpham_tang_variants: variantSelections,
  };
};

const PREFIX = "/khuyenmai";

const extractList = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.result)) return raw.result;
  return [];
};

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  return extractList(res.data).map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

const create = async (data) => {
  const res = await api.post(PREFIX, toDB(data));
  return normalize(res.data);
};

const update = async (id, data) => {
  const res = await api.put(`${PREFIX}/${id}`, toDB(data));
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default {
  getAll,
  getById,
  create,
  update,
  delete: remove,
};
