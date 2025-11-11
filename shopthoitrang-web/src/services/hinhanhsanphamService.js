// src/services/hinhanhsanphamService.js
import api from "./api";

const normalize = (r) => ({
  // MAHINHANH trong DB, backend thường trả: mahinhanh hoặc MAHINHANH
  maHinhAnh:
    r.mahinhanh ?? r.maHinhAnh ?? r.MAHINHANH ?? r.id,

  // MACHITIETSANPHAM trong DB
  maChiTietSanPham:
    r.machitietsanpham ??
    r.maChiTietSanPham ??
    r.MACHITIETSANPHAM ??
    null,

  // DUONGDANHINHANH trong DB
  duongDanHinhAnh:
    r.duongdanhinhanh ??
    r.duongDanHinhAnh ??
    r.DUONGDANHINHANH ??
    "",
});

// Chuẩn hoá dữ liệu gửi lên backend (theo tên cột trong DB)
const toDB = (d) => ({
  // Khi create thường không cần gửi mahinhhanh (identity), nhưng nếu update
  // mà backend cho phép gửi trong body cũng không sao
  mahinhanh: d.maHinhAnh ?? d.mahinhanh ?? undefined,
  machitietsanpham:
    d.maChiTietSanPham ?? d.machitietsanpham ?? undefined,
  duongdanhinhanh:
    d.duongDanHinhAnh ??
    d.duongdanhinhanh ??
    d.DUONGDANHINHANH ??
    undefined,
});

const PREFIX = "/hinhanhsanpham";

// Lấy tất cả hình ảnh (có thể truyền params nếu cần lọc)
const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const payload = Array.isArray(res.data) ? { data: res.data } : res.data;
  return (payload.data ?? payload ?? []).map(normalize);
};

// Lấy hình ảnh theo ID
const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

// Lấy tất cả hình ảnh theo mã chi tiết sản phẩm (tiện dùng nếu sau này muốn gọi riêng)
const getByChiTietSanPham = async (maChiTietSanPham) => {
  const res = await api.get(PREFIX, {
    params: { machitietsanpham: maChiTietSanPham },
  });
  const payload = Array.isArray(res.data) ? { data: res.data } : res.data;
  return (payload.data ?? payload ?? []).map(normalize);
};

// Tạo mới hình ảnh
const create = async (data) => {
  const res = await api.post(PREFIX, toDB(data));
  return normalize(res.data);
};

// Cập nhật hình ảnh
const update = async (id, data) => {
  const res = await api.put(`${PREFIX}/${id}`, toDB(data));
  return normalize(res.data);
};

// Xoá hình ảnh
const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default {
  getAll,
  getById,
  getByChiTietSanPham,
  create,
  update,
  delete: remove,
};
