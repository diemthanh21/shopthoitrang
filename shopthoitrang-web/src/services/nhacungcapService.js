// src/services/nhacungcapService.js
import api from "./api";

// Chuẩn hoá dữ liệu từ API về dạng camelCase dùng trong FE
const normalize = (r = {}) => ({
  maNhaCungCap: r.manhacungcap ?? r.maNhaCungCap ?? r.id,
  tenNhaCungCap: r.tennhacungcap ?? r.tenNhaCungCap ?? "",
  email: r.email ?? "",
  diaChi: r.diachi ?? r.diaChi ?? "",
  soDienThoai: r.sodienthoai ?? r.soDienThoai ?? "",
});

const PREFIX = "/nhacungcap";

// Lấy danh sách nhà cung cấp
const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  // Backend có thể trả mảng hoặc { data: [...] }
  const raw = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  return raw.map(normalize);
};

// Lấy chi tiết 1 nhà cung cấp
const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

// Tạo mới nhà cung cấp
// data nên là dạng DB (snake_case): { tennhacungcap, email, diachi, sodienthoai }
const create = async (data) => {
  const res = await api.post(PREFIX, data);
  return normalize(res.data);
};

// Cập nhật nhà cung cấp
// data cũng dùng dạng DB: { tennhacungcap?, email?, diachi?, sodienthoai? }
const update = async (id, data) => {
  const res = await api.put(`${PREFIX}/${id}`, data);
  return normalize(res.data);
};

// Xoá nhà cung cấp
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
