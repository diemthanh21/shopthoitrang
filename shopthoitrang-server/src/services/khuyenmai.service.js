const repo = require('../repositories/khuyenmai.repository');
const productRepo = require('../repositories/sanpham.repository');

const toNumberArray = (value) => {
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

const normalizeVariantSelections = (value = []) => {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const item of value) {
    const variantId = Number(
      item?.variantId ??
        item?.maChiTietSanPham ??
        item?.id ??
        item?.variant_id
    );
    const productId = Number(
      item?.productId ?? item?.maSanPham ?? item?.product_id ?? item?.masanpham
    );
    const sizeId = Number(
      item?.sizeId ??
        item?.kichThuocId ??
        item?.size_id ??
        item?.machitietsanpham_kichthuoc ??
        item?.bridgeId
    );
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
    if (!Number.isFinite(variantId) || variantId <= 0) continue;
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    result.push({
      productId: Number.isFinite(productId) && productId > 0 ? productId : null,
      variantId,
      sizeId: Number.isFinite(sizeId) && sizeId > 0 ? sizeId : null,
      buyQty,
      giftQty,
      quantity,
    });
  }
  return result;
};

const normalizePayload = (body = {}) => {
  const payload = {};
  payload.tenchuongtrinh = (body.tenchuongtrinh ?? body.tenChuongTrinh ?? '').trim();
  const rawType =
    body.loaikhuyenmai ??
    body.loaiKhuyenMai ??
    null;
  payload.loaikhuyenmai =
    typeof rawType === 'string' && rawType.trim().length > 0
      ? rawType.trim().toUpperCase()
      : null;
  if (!payload.loaikhuyenmai) {
    payload.loaikhuyenmai = 'GIAM_PERCENT';
  }
  payload.tylegiam = body.tylegiam ?? body.tyLeGiam ?? null;
  payload.tylegiam =
    payload.tylegiam !== null && payload.tylegiam !== undefined
      ? Number(payload.tylegiam)
      : null;
  payload.ngaybatdau = body.ngaybatdau ?? body.ngayBatDau ?? null;
  payload.ngayketthuc = body.ngayketthuc ?? body.ngayKetThuc ?? null;
  payload.mota = body.mota ?? body.moTa ?? null;
  payload.manhanvien = body.manhanvien ?? body.maNhanVien ?? null;
  payload.manhanvien =
    payload.manhanvien !== null && payload.manhanvien !== undefined
      ? Number(payload.manhanvien)
      : null;

  const applyIds =
    body.sanpham_apdung_ids ??
    body.sanPhamApDungIds ??
    body.dsSanPhamApDung ??
    body.maSanPham ??
    body.masanpham ??
    [];
  const giftIds =
    body.sanpham_tang_ids ??
    body.sanPhamTangIds ??
    body.dsSanPhamTang ??
    body.maSanPhamTang ??
    body.masanphamtang ??
    [];

  const applyArray = toNumberArray(applyIds);
  const giftArray = toNumberArray(giftIds);

  payload.sanpham_apdung_ids = applyArray.length
    ? JSON.stringify(applyArray)
    : null;
  payload.sanpham_tang_ids = giftArray.length
    ? JSON.stringify(giftArray)
    : null;
  const giftVariantSelections =
    body.sanpham_tang_variants ??
    body.sanPhamTangVariants ??
    body.chitietsanpham_tang ??
    body.chiTietSanPhamTang ??
    [];
  const normalizedVariants = normalizeVariantSelections(giftVariantSelections);
  payload.sanpham_tang_variants = normalizedVariants.length
    ? JSON.stringify(normalizedVariants)
    : null;

  // legacy single-value columns
  payload.masanpham = applyArray[0] ?? null;
  payload.masanphamtang = giftArray[0] ?? null;

  return payload;
};

const parseDateStrict = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const uniquePositiveIds = (values = []) => {
  const result = [];
  const seen = new Set();
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0 && !seen.has(num)) {
      seen.add(num);
      result.push(num);
    }
  }
  return result;
};

const getProductLabelMap = async (ids = []) => {
  const uniqueIds = uniquePositiveIds(ids);
  if (!uniqueIds.length) return new Map();
  const rows = await productRepo.getNamesByIds(uniqueIds);
  const map = new Map();
  (rows || []).forEach((row) => {
    const id = Number(row?.masanpham ?? row?.maSanPham);
    if (!Number.isFinite(id)) return;
    const name = row?.tensanpham ?? row?.tenSanPham ?? '';
    map.set(id, name);
  });
  return map;
};

const getApplyProductIdsFromBody = (body = {}) => {
  const prioritized = [
    body.sanpham_apdung_ids,
    body.sanPhamApDungIds,
    body.dsSanPhamApDung,
  ];
  for (const candidate of prioritized) {
    if (candidate !== undefined && candidate !== null && candidate !== '') {
      return toNumberArray(candidate);
    }
  }

  const fallbackSources = [body.maSanPham, body.masanpham];
  for (const source of fallbackSources) {
    if (source !== undefined && source !== null && source !== '') {
      return toNumberArray(Array.isArray(source) ? source : [source]);
    }
  }
  return [];
};

const getApplyProductIdsFromPromo = (promo) => {
  if (!promo) return [];
  if (
    Array.isArray(promo.sanPhamApDungIds) &&
    promo.sanPhamApDungIds.length > 0
  ) {
    return uniquePositiveIds(promo.sanPhamApDungIds);
  }
  const candidate =
    promo.maSanPham ?? promo.masanpham ?? promo.ma_san_pham ?? null;
  const num = Number(candidate);
  return Number.isFinite(num) && num > 0 ? [num] : [];
};

const ensureProductsAvailable = async ({
  productIds,
  startDate,
  endDate,
  excludeId,
}) => {
  const ids = uniquePositiveIds(productIds);
  if (!ids.length || !startDate || !endDate) return;

  const now = Date.now();
  const targetSet = new Set(ids);
  const labelMap = await getProductLabelMap(ids);
  const promos = await repo.getAll();

  for (const promo of promos) {
    const promoId = promo.maKhuyenMai ?? promo.makhuyenmai ?? null;
    if (excludeId && promoId && Number(promoId) === Number(excludeId)) {
      continue;
    }

    const promoStart = parseDateStrict(
      promo.ngayBatDau ?? promo.ngaybatdau ?? null
    );
    const promoEnd = parseDateStrict(
      promo.ngayKetThuc ?? promo.ngayketthuc ?? null
    );
    if (!promoStart || !promoEnd) continue;
    if (promoEnd.getTime() < now) continue; // ended

    const overlaps =
      promoStart.getTime() <= endDate.getTime() &&
      promoEnd.getTime() >= startDate.getTime();
    if (!overlaps) continue;

    const promoIds = getApplyProductIdsFromPromo(promo);
    if (!promoIds.length) continue;

    const duplicated = promoIds.filter((id) => targetSet.has(id));
    if (duplicated.length) {
      const productLabels = duplicated.map((id) => {
        const name = labelMap.get(id);
        return name ? `#${id} - ${name}` : `#${id}`;
      });
      const promoCode = promo.maKhuyenMai ?? promo.makhuyenmai ?? '';
      const promoName =
        promo.tenChuongTrinh ?? promo.tenchuongtrinh ?? `#${promoCode}`;
      const e = new Error(
        `San pham ${productLabels.join(
          ', '
        )} dang thuoc khuyen mai \"${promoName}\" trong khoang thoi gian trung lap`
      );
      e.status = 400;
      throw e;
    }
  }
};

class KhuyenMaiService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy khuyến mãi');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    const required = [
      ['tenchuongtrinh', 'tenChuongTrinh'],
      ['ngaybatdau', 'ngayBatDau'],
      ['ngayketthuc', 'ngayKetThuc'],
      ['manhanvien', 'maNhanVien'],
    ];
    for (const [snake, camel] of required) {
      const value = body[snake] ?? body[camel];
      if (value === undefined || value === null || value === '') {
        const e = new Error(`Thieu thong tin bat buoc: ${snake}`);
        e.status = 400;
        throw e;
      }
    }

    const rawLoai = (
      body.loaikhuyenmai ??
      body.loaiKhuyenMai ??
      ''
    )
      .toString()
      .trim()
      .toUpperCase();
    const typeCode = rawLoai || 'GIAM_PERCENT';
    if (!['GIAM_PERCENT', 'TANG'].includes(typeCode)) {
      const e = new Error('Vui long chon loai khuyen mai hop le (Giam % hoac Tang)');
      e.status = 400;
      throw e;
    }

    const startDate = parseDateStrict(body.ngaybatdau ?? body.ngayBatDau);
    const endDate = parseDateStrict(body.ngayketthuc ?? body.ngayKetThuc);
    if (!startDate || !endDate || endDate < startDate) {
      const e = new Error('Khoang ngay khong hop le (ngay ket thuc phai >= ngay bat dau)');
      e.status = 400;
      throw e;
    }

    const hasPercentInput = body.tylegiam !== undefined || body.tyLeGiam !== undefined;
    if (typeCode === 'GIAM_PERCENT') {
      const value = Number(body.tylegiam ?? body.tyLeGiam ?? 0);
      if (!(value > 0 && value <= 100)) {
        const e = new Error('Ty le giam phai nam trong khoang (0, 100]');
        e.status = 400;
        throw e;
      }
      body.tylegiam = value;
    } else if (hasPercentInput) {
      body.tylegiam = null;
      body.tyLeGiam = null;
    }

    const productIds = getApplyProductIdsFromBody(body);
    await ensureProductsAvailable({
      productIds,
      startDate,
      endDate,
    });

    const payload = normalizePayload({ ...body, loaikhuyenmai: typeCode });
    payload.tylegiam = typeCode === 'GIAM_PERCENT' ? payload.tylegiam : null;
    return repo.create(payload);
  }

  async update(id, body) {
    const current = await repo.getById(id);
    if (!current) {
      const e = new Error('Khong tim thay khuyen mai de cap nhat');
      e.status = 404;
      throw e;
    }

    const startRaw =
      body.ngaybatdau ?? body.ngayBatDau ?? current.ngayBatDau ?? current.ngaybatdau;
    const endRaw =
      body.ngayketthuc ?? body.ngayKetThuc ?? current.ngayKetThuc ?? current.ngayketthuc;
    const startDate = parseDateStrict(startRaw);
    const endDate = parseDateStrict(endRaw);
    if (!startDate || !endDate || endDate < startDate) {
      const e = new Error('Ngay ket thuc phai lon hon hoac bang ngay bat dau');
      e.status = 400;
      throw e;
    }

    const rawLoaiUpdate = (
      body.loaikhuyenmai ??
      body.loaiKhuyenMai ??
      current.loaiKhuyenMai ??
      current.loaikhuyenmai ??
      ''
    )
      .toString()
      .trim()
      .toUpperCase();
    const typeCodeUpdate = rawLoaiUpdate || 'GIAM_PERCENT';
    if (!['GIAM_PERCENT', 'TANG'].includes(typeCodeUpdate)) {
      const e = new Error('Vui long chon loai khuyen mai hop le (Giam % hoac Tang)');
      e.status = 400;
      throw e;
    }

    const hasPercentInput =
      body.tylegiam !== undefined || body.tyLeGiam !== undefined;
    if (typeCodeUpdate === 'GIAM_PERCENT') {
      const value = Number(
        body.tylegiam ??
          body.tyLeGiam ??
          current.tyLeGiam ??
          current.tylegiam ??
          0
      );
      if (!(value > 0 && value <= 100)) {
        const e = new Error('Ty le giam phai nam trong khoang (0, 100]');
        e.status = 400;
        throw e;
      }
      body.tylegiam = value;
    } else if (hasPercentInput) {
      body.tylegiam = null;
      body.tyLeGiam = null;
    }

    const productIds = getApplyProductIdsFromBody(body);
    const targetProductIds =
      productIds.length > 0 ? productIds : getApplyProductIdsFromPromo(current);
    await ensureProductsAvailable({
      productIds: targetProductIds,
      startDate,
      endDate,
      excludeId: id,
    });

    const payload = normalizePayload({ ...body, loaikhuyenmai: typeCodeUpdate });
    payload.tylegiam =
      typeCodeUpdate === 'GIAM_PERCENT'
        ? payload.tylegiam ?? current.tyLeGiam ?? current.tylegiam ?? null
        : null;

    const updated = await repo.update(id, payload);
    if (!updated) {
      const e = new Error('Khong tim thay khuyen mai de cap nhat');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Khong tim thay khuyen mai de xoa');
      e.status = 404;
      throw e;
    }
    return { message: 'Da xoa khuyen mai thanh cong' };
  }
}

module.exports = new KhuyenMaiService();
