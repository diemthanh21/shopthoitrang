// src/services/chucnangService.js
import api from "./api";

// Chuẩn hóa response từ DB (snake_case) → camelCase
const normalize = (r) => ({
  maChucNang: r.machucnang ?? r.maChucNang ?? r.id,
  tenChucNang: r.tenchucnang ?? r.tenChucNang ?? "",
  maQuyen: r.maquyen ?? r.maQuyen ?? "",
});

const PREFIX = "/chucnang";

// ========== CRUD ==========
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
  // Chấp nhận cả camelCase & snake_case từ UI
  const body = {
    tenchucnang: data.tenchucnang ?? data.tenChucNang ?? "",
    maquyen: data.maquyen ?? data.maQuyen ?? "",
  };

  if (!body.tenchucnang) throw new Error("Thiếu tên chức năng");
  if (!body.maquyen) throw new Error("Thiếu mã quyền");

  const res = await api.post(PREFIX, body);
  return normalize(res.data);
};

const update = async (id, data) => {
  const body = {
    tenchucnang: data.tenchucnang ?? data.tenChucNang ?? "",
    maquyen: data.maquyen ?? data.maQuyen ?? "",
  };
  const res = await api.put(`${PREFIX}/${id}`, body);
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default { getAll, getById, create, update, delete: remove };
