import api from "./api";

const normalize = (r = {}) => ({
  maSanPham: r.masanpham ?? r.maSanPham ?? r.id,
  tenSanPham: r.tensanpham ?? r.tenSanPham ?? "",
  maDanhMuc: r.madanhmuc ?? r.maDanhMuc ?? null,
  maThuongHieu: r.mathuonghieu ?? r.maThuongHieu ?? null,
  trangThai: r.trangthai ?? r.trangThai ?? null,
  hinhAnh: r.hinhanh ?? r.hinhAnh ?? null,
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
