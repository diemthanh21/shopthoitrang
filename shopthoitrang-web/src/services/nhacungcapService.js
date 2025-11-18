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

// Map field names gửi lên API (chuẩn snake_case DB)
function buildBody(data = {}) {
  return {
    tennhacungcap: data.tennhacungcap ?? data.tenNhaCungCap ?? null,
    email: data.email ?? null,
    diachi: data.diachi ?? data.diaChi ?? null,
    sodienthoai: data.sodienthoai ?? data.soDienThoai ?? null,
  };
}

// Tạo mới nhà cung cấp
const create = async (data) => {
  const body = buildBody(data);
  const res = await api.post(PREFIX, body);
  return normalize(res.data);
};

// Cập nhật nhà cung cấp
const update = async (id, data) => {
  const body = buildBody(data);
  const res = await api.put(`${PREFIX}/${id}`, body);
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
