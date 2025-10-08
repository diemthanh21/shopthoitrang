import api from "./api";

// DB (snake_case) -> UI (camelCase)
const normalize = (r) => ({
  maDonHang: r.madonhang ?? r.maDonHang ?? r.id,
  maKhachHang: r.makhachhang ?? r.maKhachHang ?? null,
  ngayDatHang: r.ngaydathang ?? r.ngayDatHang ?? null,              // ISO string / date
  thanhTien: r.thanhtien ?? r.thanhTien ?? 0,                       // number
  phuongThucThanhToan: r.phuongthucthanhtoan ?? r.phuongThucThanhToan ?? null,
  trangThaiThanhToan: r.trangthaithanhtoan ?? r.trangThaiThanhToan ?? null,
  trangThaiDonHang: r.trangthaidonhang ?? r.trangThaiDonHang ?? null,
});

const PREFIX = "/donhang";

const pickList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.result)) return raw.result;
  return [];
};

// Lấy tất cả (có thể truyền params như status, q, from, to...)
const getAll = async (params = {}, opts = {}) => {
  const res = await api.get(PREFIX, { params, signal: opts.signal });
  return pickList(res.data).map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

const create = async (d) => {
  const res = await api.post(PREFIX, {
    madonhang: d.maDonHang ?? undefined,
    makhachhang: d.maKhachHang,
    ngaydathang: d.ngayDatHang,
    thanhtien: d.thanhTien,
    phuongthucthanhtoan: d.phuongThucThanhToan,
    trangthaithanhtoan: d.trangThaiThanhToan,
    trangthaidonhang: d.trangThaiDonHang,
  });
  return normalize(res.data);
};

const update = async (id, d) => {
  const res = await api.put(`${PREFIX}/${id}`, {
    makhachhang: d.maKhachHang,
    ngaydathang: d.ngayDatHang,
    thanhtien: d.thanhTien,
    phuongthucthanhtoan: d.phuongThucThanhToan,
    trangthaithanhtoan: d.trangThaiThanhToan,
    trangthaidonhang: d.trangThaiDonHang,
  });
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default { getAll, getById, create, update, delete: remove };
