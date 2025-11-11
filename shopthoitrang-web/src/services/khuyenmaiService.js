// src/services/khuyenmaiService.js
import api from "./api";

// Chuẩn hoá 1 record khuyến mãi từ backend -> dạng camelCase dùng trong FE
const normalize = (r) => ({
  maKhuyenMai: r.makhuyenmai ?? r.maKhuyenMai ?? r.id,
  tenChuongTrinh: r.tenchuongtrinh ?? r.tenChuongTrinh ?? "",
  loaiKhuyenMai: r.loaikhuyenmai ?? r.loaiKhuyenMai ?? "",
  maSanPham: r.masanpham ?? r.maSanPham ?? null,
  tyLeGiam: r.tylegiam ?? r.tyLeGiam ?? 0,
  maSanPhamTang: r.masanphamtang ?? r.maSanPhamTang ?? null,
  ngayBatDau: r.ngaybatdau ?? r.ngayBatDau ?? null,
  ngayKetThuc: r.ngayketthuc ?? r.ngayKetThuc ?? null,
  moTa: r.mota ?? r.moTa ?? "",
  maNhanVien: r.manhanvien ?? r.maNhanVien ?? null,
});

// Map ngược lại FE -> payload gửi lên DB (snake_case)
const toDB = (k) => ({
  makhuyenmai: k.maKhuyenMai ?? k.makhuyenmai ?? undefined, // để undefined để backend tự tăng nếu là thêm mới
  tenchuongtrinh: k.tenChuongTrinh ?? k.tenchuongtrinh ?? "",
  loaikhuyenmai: k.loaiKhuyenMai ?? k.loaikhuyenmai ?? "",
  masanpham:
    k.maSanPham ?? k.masanpham != null ? Number(k.maSanPham ?? k.masanpham) : null,
  tylegiam:
    k.tyLeGiam ?? k.tylegiam != null ? Number(k.tyLeGiam ?? k.tylegiam) : 0,
  masanphamtang:
    k.maSanPhamTang ?? k.masanphamtang != null
      ? Number(k.maSanPhamTang ?? k.masanphamtang)
      : null,
  ngaybatdau: k.ngayBatDau ?? k.ngaybatdau ?? null,
  ngayketthuc: k.ngayKetThuc ?? k.ngayketthuc ?? null,
  mota: k.moTa ?? k.mota ?? null,
  manhanvien:
    k.maNhanVien ?? k.manhanvien != null
      ? Number(k.maNhanVien ?? k.manhanvien)
      : null,
});

const PREFIX = "/khuyenmai"; // chỉnh lại nếu backend dùng route khác

// Lấy tất cả khuyến mãi
const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const raw = res.data;

  let list = [];
  if (Array.isArray(raw)) list = raw;
  else if (Array.isArray(raw?.data)) list = raw.data;
  else if (Array.isArray(raw?.items)) list = raw.items;
  else if (Array.isArray(raw?.result)) list = raw.result;

  return list.map(normalize);
};

// Lấy 1 khuyến mãi theo id
const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

// Tạo mới khuyến mãi
const create = async (data) => {
  const res = await api.post(PREFIX, toDB(data));
  return normalize(res.data);
};

// Cập nhật khuyến mãi
const update = async (id, data) => {
  const res = await api.put(`${PREFIX}/${id}`, toDB(data));
  return normalize(res.data);
};

// Xoá khuyến mãi
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
