import api from "./api";

const PREFIX = "/lichsudonhang";

const normalize = (r) => ({
  id: r.id,
  maDonHang: r.madonhang ?? r.maDonHang,
  maNhanVien: r.manhanvien ?? r.maNhanVien,
  trangThaiCu: r.trangthaicu ?? r.trangThaiCu,
  trangThaiMoi: r.trangthaimoi ?? r.trangThaiMoi,
  ghiChu: r.ghichu ?? r.ghiChu,
  thoiGian: r.thoigian ?? r.thoiGian,
});

const getByOrder = async (madonhang) => {
  const res = await api.get(`${PREFIX}/order/${madonhang}`);
  const list = Array.isArray(res.data) ? res.data : [];
  return list.map(normalize);
};

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const list = Array.isArray(res.data) ? res.data : [];
  return list.map(normalize);
};

export default { getByOrder, getAll };
