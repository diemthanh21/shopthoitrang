// src/services/chitietphieunhapService.js
import api from "./api";

// Chuẩn hoá từ DB -> UI
const normalize = (r) => ({
  maChiTietNhap: r.machitietnhap ?? r.maChiTietNhap ?? r.id,
  maPhieuNhap: r.maphieunhap ?? r.maPhieuNhap ?? null,
  maChiTietSanPham: r.machitietsanpham ?? r.maChiTietSanPham ?? null,
  soLuong: r.soluong ?? r.soLuong ?? 0,
  ghiChu: r.ghichu ?? r.ghiChu ?? null,
});

// UI -> DB
const toDB = (d) => ({
  maphieunhap: d.maPhieuNhap ?? d.maphieunhap,
  machitietsanpham: d.maChiTietSanPham ?? d.machitietsanpham,
  soluong: d.soLuong ?? d.soluong,
  ghichu: d.ghiChu ?? d.ghichu ?? null,
});

const PREFIX = "/chitietphieunhap";

// Hàm hỗ trợ bóc mảng từ nhiều dạng response khác nhau
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

// Lấy tất cả chi tiết theo mã phiếu nhập
const getByPhieu = async (maPhieuNhap) => {
  const res = await api.get(PREFIX, {
    params: { maphieunhap: maPhieuNhap },
  });
  const arr = extractArray(res.data);
  return arr.map(normalize);
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

export default {
  getAll,
  getById,
  getByPhieu,
  create,
  update,
  delete: remove,
};
