import api from "./api";

const normalizeTrangThai = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;

  const truthy = new Set(["true", "1", "dang ban", "đang bán", "active", "on"]);
  const falsy = new Set([
    "false",
    "0",
    "ngung ban",
    "ngừng bán",
    "nghi ban",
    "dung ban",
    "inactive",
    "off",
  ]);

  if (truthy.has(normalized)) return true;
  if (falsy.has(normalized)) return false;
  return Boolean(value);
};

const normalize = (r = {}) => ({
  maSanPham: r.masanpham ?? r.maSanPham ?? r.id,
  tenSanPham: r.tensanpham ?? r.tenSanPham ?? "",
  maDanhMuc: r.madanhmuc ?? r.maDanhMuc ?? null,
  maThuongHieu: r.mathuonghieu ?? r.maThuongHieu ?? null,
  trangThai: normalizeTrangThai(r.trangthai ?? r.trangThai),
  hinhAnh: r.hinhanh ?? r.hinhAnh ?? null,
  bangSize: r.bangsize ?? r.bangSize ?? null,
});

const toDB = (data = {}) => {
  const payload = {};
  if (data.maSanPham !== undefined) payload.masanpham = data.maSanPham;
  if (data.tenSanPham !== undefined) payload.tensanpham = data.tenSanPham;
  if (data.maDanhMuc !== undefined) payload.madanhmuc = data.maDanhMuc;
  if (data.maThuongHieu !== undefined)
    payload.mathuonghieu = data.maThuongHieu;
  if (data.trangThai !== undefined) payload.trangthai = data.trangThai;
  if (data.hinhAnh !== undefined) payload.hinhanh = data.hinhAnh ?? null;
  if (data.bangSize !== undefined) payload.bangsize = data.bangSize ?? null;
  return payload;
};

const PREFIX = "/sanpham";

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const payload = Array.isArray(res.data) ? { data: res.data } : res.data;
  return (payload.data ?? payload ?? []).map(normalize);
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

export default { getAll, getById, create, update, delete: remove };
