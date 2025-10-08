import api from "./api";

const normalize = (r) => ({
  maPhanCong: r.maphancong ?? r.maPhanCong ?? r.id,
  maNhanVien: r.manhanvien ?? r.maNhanVien ?? null,
  maCa: r.maca ?? r.maCa ?? null,
  ngayLamViec: r.ngaylamviec ?? r.ngayLamViec ?? null,
  trangThai: r.trangthai ?? r.trangThai ?? null,
  ghiChu: r.ghichu ?? r.ghiChu ?? null,
  nguoiPhanCong: r.nguoiphancong ?? r.nguoiPhanCong ?? null,
  ngayPhanCong: r.ngayphancong ?? r.ngayPhanCong ?? null,
});

const PREFIX = "/phancongca";

const pickList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.result)) return raw.result;
  return [];
};

// ✅ Cho phép truyền { signal } để hủy request cũ
const getByDateRange = async (from, to, opts = {}) => {
  const { signal, ...extra } = opts;
  const res = await api.get(PREFIX, { params: { from, to, ...extra }, signal });
  return pickList(res.data).map(normalize);
};

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  return pickList(res.data).map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

const create = async (d) => {
  const res = await api.post(PREFIX, {
    maphancong: d.maPhanCong ?? undefined,
    manhanvien: d.maNhanVien,
    maca: d.maCa,
    ngaylamviec: d.ngayLamViec,
    trangthai: d.trangThai,
    ghichu: d.ghiChu ?? null,
    nguoiphancong: d.nguoiPhanCong ?? null,
    ngayphancong: d.ngayPhanCong ?? null,
  });
  return normalize(res.data);
};

const update = async (id, d) => {
  const res = await api.put(`${PREFIX}/${id}`, {
    manhanvien: d.maNhanVien,
    maca: d.maCa,
    ngaylamviec: d.ngayLamViec,
    trangthai: d.trangThai,
    ghichu: d.ghiChu ?? null,
    nguoiphancong: d.nguoiPhanCong ?? null,
    ngayphancong: d.ngayPhanCong ?? null,
  });
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default { getAll, getByDateRange, getById, create, update, delete: remove };
