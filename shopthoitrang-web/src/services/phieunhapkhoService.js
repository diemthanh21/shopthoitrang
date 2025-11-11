// src/services/phieunhapkhoService.js
import api from "./api";

const PREFIX = "/phieunhapkho";

/**
 * Map dữ liệu từ DB (snake_case) → giao diện (camelCase)
 */
const normalize = (r) => ({
  maPhieuNhap: r.maphieunhap ?? r.maPhieuNhap ?? r.id,
  maNhanVien: r.manhanvien ?? r.maNhanVien ?? null,
  maNhaCungCap: r.manhacungcap ?? r.maNhaCungCap ?? null,
  ngayNhap: r.ngaynhap ?? r.ngayNhap ?? null,
  trangThai: r.trangthai ?? r.trangThai ?? "Tạo mới", // ✅ thêm thuộc tính mới
  ghiChu: r.ghichu ?? r.ghiChu ?? null,
});

/**
 * Map dữ liệu từ giao diện (camelCase) → DB (snake_case)
 */
const toDB = (d) => ({
  maphieunhap: d.maPhieuNhap ?? undefined, // thường auto-increment khi create
  manhanvien: d.maNhanVien,
  manhacungcap: d.maNhaCungCap,
  ngaynhap: d.ngayNhap,
  trangthai: d.trangThai ?? "Tạo mới", // ✅ thêm thuộc tính mới
  ghichu: d.ghiChu ?? null,
});

/**
 * Chuẩn hóa danh sách dữ liệu trả về từ API
 */
const extractList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  return [data]; // object đơn lẻ
};

/**
 * Lấy danh sách phiếu nhập kho
 */
const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const list = extractList(res.data);
  return list.map(normalize);
};

/**
 * Lấy chi tiết 1 phiếu nhập kho theo ID
 */
const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

/**
 * Tạo mới phiếu nhập kho
 */
const create = async (data) => {
  const payload =
    data.manhanvien || data.manhacungcap || data.ngaynhap
      ? data // dữ liệu đã ở dạng snake_case
      : toDB(data); // convert nếu là camelCase

  const res = await api.post(PREFIX, payload);
  return normalize(res.data);
};

/**
 * Cập nhật phiếu nhập kho
 */
const update = async (id, data) => {
  const payload =
    data.manhanvien || data.manhacungcap || data.ngaynhap
      ? data
      : toDB(data);

  const res = await api.put(`${PREFIX}/${id}`, payload);
  return normalize(res.data);
};

/**
 * Xóa phiếu nhập kho
 */
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
