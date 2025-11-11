// src/services/taikhoannhanvienService.js
import api from "./api";

// Chuẩn hoá dữ liệu từ backend -> frontend
const normalize = (r) => ({
  maNhanVien:
    r.manhanvien ??
    r.maNhanVien ??
    r.MANHANVIEN ??
    null,
  tenDangNhap:
    r.tendangnhap ??
    r.tenDangNhap ??
    r.TENDANGNHAP ??
    "",
  // backend thường không trả mật khẩu, nên để null
  matKhau:
    r.matkhau ??
    r.matKhau ??
    r.MATKHAU ??
    null,
  dangHoatDong:
    r.danghoatdong ??
    r.dangHoatDong ??
    r.DANGHOATDONG ??
    false,
});

// Chuẩn hoá dữ liệu từ frontend -> backend (theo tên cột trong DB)
const toDB = (d) => ({
  manhanvien: d.maNhanVien ?? d.manhanvien ?? undefined,
  tendangnhap: d.tenDangNhap ?? d.tendangnhap ?? undefined,
  // chỉ gửi mật khẩu khi có (nếu bạn muốn để trống để không đổi)
  ...(d.matKhau || d.matkhau
    ? { matkhau: d.matKhau ?? d.matkhau }
    : {}),
  danghoatdong:
    d.dangHoatDong ??
    d.danghoatdong ??
    undefined,
});

const PREFIX = "/taikhoannhanvien";

// Lấy tất cả tài khoản
const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const payload = Array.isArray(res.data) ? { data: res.data } : res.data;
  return (payload.data ?? payload ?? []).map(normalize);
};

// Lấy theo mã nhân viên (id)
const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

// Tạo mới
const create = async (data) => {
  const res = await api.post(PREFIX, toDB(data));
  return normalize(res.data);
};

// Cập nhật
const update = async (id, data) => {
  const res = await api.put(`${PREFIX}/${id}`, toDB(data));
  return normalize(res.data);
};

// Xoá (nếu backend hỗ trợ, còn không xài cũng được)
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
