import api from './api';

const normalize = (r) => ({
  maChiTietPhieuDatHang: r.machitietphieudathang ?? r.maChiTietPhieuDatHang ?? r.id,
  maPhieuDatHang: r.maphieudathang ?? r.maPhieuDatHang ?? null,
  maChiTietSanPham: r.machitietsanpham ?? r.maChiTietSanPham ?? null,
  soLuong: r.soluong ?? r.soLuong ?? 0,
  donGia: r.dongia ?? r.donGia ?? 0,
  thanhTien: r.thanhtien ?? r.thanhTien ?? 0,
  ghiChu: r.ghichu ?? r.ghiChu ?? null,
});

const toDB = (d) => ({
  maphieudathang: d.maPhieuDatHang ?? undefined,
  machitietsanpham: d.maChiTietSanPham ?? undefined,
  soluong: d.soLuong ?? undefined,
  dongia: d.donGia ?? undefined,
  thanhtien: d.thanhTien ?? undefined,
  ghichu: d.ghiChu ?? undefined,
});

const PREFIX = '/chitietphieudathang';

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const payload = Array.isArray(res.data) ? { data: res.data } : res.data;
  return (payload.data ?? payload ?? []).map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

// Convenience: get all detail rows for a particular phieu id
const getByPhieu = async (maPhieu) => {
  const list = await getAll();
  const idNum = Number(maPhieu);
  return list.filter((r) => Number(r.maPhieuDatHang) === idNum || r.maPhieuDatHang == maPhieu || (r.maphieudathang && Number(r.maphieudathang) === idNum));
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

export default { getAll, getById, getByPhieu, create, update, delete: remove };
