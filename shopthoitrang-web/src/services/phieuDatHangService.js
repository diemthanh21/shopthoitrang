import api from './api';

const normalize = (r) => ({
  maPhieuDatHang: r.maphieudathang ?? r.maPhieuDatHang ?? r.id,
  maNhaCungCap: r.manhacungcap ?? r.maNhaCungCap ?? null,
  maNhanVien: r.manhanvien ?? r.maNhanVien ?? null,
  ngayDatPhieu: r.ngaydatphieu ?? r.ngayDatPhieu ?? null,
  ngayHenDuKien: r.ngayhendukien ?? r.ngayHenDuKien ?? null,
  tongTien: r.tongtien ?? r.tongTien ?? 0,
  tienCoc: r.tiencoc ?? r.tienCoc ?? 0,
  conLai: r.conlai ?? r.conLai ?? 0,
  phuongThucThanhToan: r.phuongthucthanhtoan ?? r.phuongThucThanhToan ?? null,
  trangThaiPhieu: r.trangthaiphieu ?? r.trangThaiPhieu ?? null,
  ghiChu: r.ghichu ?? r.ghiChu ?? null,
});

const toDB = (d) => ({
  manhacungcap: d.maNhaCungCap ?? undefined,
  manhanvien: d.maNhanVien ?? undefined,
  ngaydatphieu: d.ngayDatPhieu ?? undefined,
  ngayhendukien: d.ngayHenDuKien ?? undefined,
  tongtien: d.tongTien ?? undefined,
  tiencoc: d.tienCoc ?? undefined,
  conlai: d.conLai ?? undefined,
  phuongthucthanhtoan: d.phuongThucThanhToan ?? undefined,
  trangthaiphieu: d.trangThaiPhieu ?? undefined,
  ghichu: d.ghiChu ?? undefined,
});

const PREFIX = '/phieudathang';

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const payload = Array.isArray(res.data) ? { data: res.data } : res.data;
  return (payload.data ?? payload ?? []).map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
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

export default { getAll, getById, create, update, delete: remove };
