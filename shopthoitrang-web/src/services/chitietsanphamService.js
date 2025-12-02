// src/services/chitietsanphamService.js
import api from "./api";

const PREFIX = "/chitietsanpham";

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeSizes = (raw) => {
  const source = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.chitietsanpham_kichthuoc)
    ? raw.chitietsanpham_kichthuoc
    : [];

  return source.map((item) => {
    const sizeRow = item?.kichthuocs ?? {};
    return {
      id:
        item?.id ??
        item?.machitietsanpham_kichthuoc ??
        item?.bridgeId ??
        null,
      maKichThuoc:
        item?.maKichThuoc ??
        item?.makichthuoc ??
        sizeRow?.makichthuoc ??
        null,
      tenKichThuoc:
        item?.tenKichThuoc ??
        item?.ten_kichthuoc ??
        sizeRow?.ten_kichthuoc ??
        "",
      moTa: item?.moTa ?? item?.mo_ta ?? sizeRow?.mo_ta ?? "",
      soLuong: toNumber(item?.soLuong ?? item?.so_luong, 0),
      giaThem: toNumber(item?.giaThem ?? item?.gia_them, 0),
 
    };
  });
};

// Chuẩn hoá từ DB -> UI
const normalize = (row = {}) => {
  const sizes = normalizeSizes(row?.sizes ?? row?.chitietsanpham_kichthuoc);
  const primarySize = sizes.length ? sizes[0].tenKichThuoc : "";

  return {
    maChiTietSanPham: row.machitietsanpham ?? row.maChiTietSanPham ?? row.id,
    maSanPham: row.masanpham ?? row.maSanPham ?? null,
    kichThuoc: row.kichthuoc ?? row.kichThuoc ?? primarySize ?? "",
    mauSac: row.mausac ?? row.mauSac ?? "",
    chatLieu: row.chatlieu ?? row.chatLieu ?? "",
    moTa: row.mota ?? row.moTa ?? "",
    giaBan: row.giaban ?? row.giaBan ?? 0,
    soLuongTon: row.soluongton ?? row.soLuongTon ?? 0,
    sizes,
  };
};

// UI -> DB
const toDB = (d = {}) => ({
  masanpham: d.maSanPham ?? d.masanpham,
  mausac: d.mauSac ?? d.mausac ?? null,
  chatlieu: d.chatLieu ?? d.chatlieu ?? null,
  mota: d.moTa ?? d.mota ?? null,
  giaban: d.giaBan ?? d.giaban ?? 0,
});

// Hàm hỗ trợ trộn nhiều dạng response khác nhau
const extractArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (raw && typeof raw === "object") return [raw];
  return [];
};

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const arr = extractArray(res.data);
  return arr.map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

const tryFetchWithParams = async (params) => {
  const res = await api.get(PREFIX, { params });
  return extractArray(res.data);
};

const getByProductId = async (maSanPham) => {
  if (!maSanPham) return [];

  const attempts = [
    { masanpham: maSanPham },
    { maSanPham },
  ];

  for (const params of attempts) {
    try {
      const arr = await tryFetchWithParams(params);
      if (arr.length) {
        return arr.map(normalize);
      }
    } catch (err) {
      console.warn("[chitietsanpham] query failed", params, err);
    }
  }

  // Fallback: lấy toàn bộ rồi filter client-side
  try {
    const res = await api.get(PREFIX);
    const arr = extractArray(res.data).filter((item) => {
      const value = item.masanpham ?? item.maSanPham;
      return Number(value) === Number(maSanPham);
    });
    return arr.map(normalize);
  } catch (error) {
    console.error("[chitietsanpham] fallback fetch error", error);
    throw error;
  }
};

const create = async (data) => {
  const payload = toDB(data);
  const res = await api.post(PREFIX, payload);
  return normalize(res.data);
};

const update = async (id, data) => {
  const payload = toDB(data);
  const res = await api.put(`${PREFIX}/${id}`, payload);
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

const getSizes = async (variantId) => {
  if (!variantId) return [];
  const res = await api.get(`${PREFIX}/${variantId}/sizes`);
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.sizes)) return res.data.sizes;
  return [];
};

const saveSizes = async (variantId, sizes = []) => {
  if (!variantId) throw new Error("Thiếu mã chi tiết sản phẩm");
  const payload = Array.isArray(sizes) ? sizes : [];
  const res = await api.post(`${PREFIX}/${variantId}/sizes`, { sizes: payload });
  return res.data;
};

export default {
  getAll,
  getById,
  getByProductId,
  create,
  update,
  getSizes,
  saveSizes,
  delete: remove,
};
