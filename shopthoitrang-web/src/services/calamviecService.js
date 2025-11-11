// src/services/calamviecService.js
import api from "./api";

// Chuẩn hoá dữ liệu từ backend -> frontend (camelCase)
const normalize = (r) => ({
  maCa: r.maca ?? r.maCa ?? r.id,
  tenCa: r.tenca ?? r.tenCa ?? "",
  gioBatDau: r.giobatdau ?? r.gioBatDau ?? null,     // 'HH:MM' hoặc 'HH:MM:SS'
  gioKetThuc: r.gioketthuc ?? r.gioKetThuc ?? null,   // 'HH:MM' hoặc 'HH:MM:SS'
  moTa: r.mota ?? r.moTa ?? null,
});

const PREFIX = "/calamviec";

// Helper gom list từ nhiều kiểu payload khác nhau
const pickList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.result)) return raw.result;
  return [];
};

// Chuyển dữ liệu từ FE -> BE (snake_case theo DB)
const toDB = (d) => ({
  maca: d.maCa ?? d.maca ?? undefined,
  tenca: d.tenCa ?? d.tenca ?? "",
  giobatdau: d.gioBatDau ?? d.giobatdau ?? null,
  gioketthuc: d.gioKetThuc ?? d.gioketthuc ?? null,
  mota: d.moTa ?? d.mota ?? null,
});

// ========== CRUD ==========

// Lấy danh sách ca làm việc
const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const list = pickList(res.data);
  return list.map(normalize);
};

// Lấy ca theo ID
const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

// Tạo mới ca làm việc
const create = async (data) => {
  const body = toDB(data);
  if (!body.tenca) throw new Error("Thiếu tên ca làm việc");
  if (!body.giobatdau) throw new Error("Thiếu giờ bắt đầu");
  if (!body.gioketthuc) throw new Error("Thiếu giờ kết thúc");

  const res = await api.post(PREFIX, body);
  return normalize(res.data);
};

// Cập nhật ca làm việc
const update = async (id, data) => {
  const body = toDB(data);
  const res = await api.put(`${PREFIX}/${id}`, body);
  return normalize(res.data);
};

// Xoá ca làm việc
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
