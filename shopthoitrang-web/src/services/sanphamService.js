import api from "./api";

// Map snake_case (DB) -> camelCase (UI)
const normalize = (r) => ({
  maSanPham: r.masanpham ?? r.maSanPham ?? r.id,
  tenSanPham: r.tensanpham ?? r.tenSanPham ?? "",
  maDanhMuc: r.madanhmuc ?? r.maDanhMuc ?? null,
  maThuongHieu: r.mathuonghieu ?? r.maThuongHieu ?? null,
  trangThai: r.trangthai ?? r.trangThai ?? null, // model có trường này
});

// Map camelCase (UI) -> snake_case (DB)
const toDB = (data) => ({
  masanpham: data.maSanPham ?? undefined, // thường auto-increment
  tensanpham: data.tenSanPham,
  madanhmuc: data.maDanhMuc,
  mathuonghieu: data.maThuongHieu,
  trangthai: data.trangThai,
});

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
