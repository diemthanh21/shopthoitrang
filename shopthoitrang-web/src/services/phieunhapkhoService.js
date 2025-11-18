// src/services/phieunhapkhoService.js
import api from "./api";

const PREFIX = "/phieunhapkho";

/**
 * Map snake_case (API) to camelCase (UI)
 */
const normalize = (r) => ({
  maPhieuNhap: r.maphieunhap ?? r.maPhieuNhap ?? r.id,
  maNhanVien: r.manhanvien ?? r.maNhanVien ?? null,
  maPhieuDatHang: r.maphieudathang ?? r.maPhieuDatHang ?? null,
  maNhaCungCap: r.manhacungcap ?? r.maNhaCungCap ?? null,
  ngayNhap: r.ngaynhap ?? r.ngayNhap ?? null,
  trangThai: r.trangthai ?? r.trangThai ?? "Tao moi",
  ghiChu: r.ghichu ?? r.ghiChu ?? null,
});

/**
 * Map camelCase (UI) to snake_case (API)
 */
const toDB = (d) => {
  const payload = {
    maphieunhap: d.maPhieuNhap ?? undefined,
    manhanvien: d.maNhanVien,
    maphieudathang: d.maPhieuDatHang,
    ngaynhap: d.ngayNhap,
    ghichu: d.ghiChu ?? null,
  };

  if (d.trangThai) {
    payload.trangthai = d.trangThai;
  }

  return payload;
};

const extractList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  return [data];
};

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const list = extractList(res.data);
  return list.map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

const create = async (data) => {
  const payload =
    data.manhanvien || data.maphieudathang || data.ngaynhap
      ? data
      : toDB(data);

  const res = await api.post(PREFIX, payload);
  return normalize(res.data);
};

const update = async (id, data) => {
  const payload =
    data.manhanvien || data.maphieudathang || data.ngaynhap
      ? data
      : toDB(data);

  const res = await api.put(`${PREFIX}/${id}`, payload);
  return normalize(res.data);
};

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
