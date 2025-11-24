import api from './api';

const normalize = (r) => ({
  id: r.id ?? r.matrahang ?? r.matrahang,
  maTraHang: r.matrahang ?? r.id,
  maDonHang: r.madonhang ?? r.maDonHang ?? null,
  maKhachHang: r.makhachhang ?? r.maKhachHang ?? null,
  maChiTietSanPham: r.machitietsanpham ?? r.maChiTietSanPham ?? null,
  soLuong: r.soluong ?? r.soLuong ?? 0,
  lyDo: r.lydo ?? r.lyDo ?? null,
  hinhAnhLoi: r.hinhanhloi ?? r.hinhAnhLoi ?? null,
  ngayYeuCau: r.ngayyeucau ?? r.ngayYeuCau ?? null,
  trangThai: r.trangthai ?? r.trangThai ?? null,
  ghiChu: r.ghichu ?? r.ghiChu ?? null,
});

const PREFIX = '/trahang';

const pickList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.result)) return raw.result;
  return [];
};

const getAll = async (params = {}, opts = {}) => {
  const res = await api.get(PREFIX, { params, signal: opts.signal });
  return pickList(res.data).map(normalize);
};

// Lấy các phiếu trả hàng theo mã đơn (dùng cho trang chi tiết đơn)
const getByOrder = async (maDonHang, opts = {}) => {
  const res = await api.get(PREFIX, {
    params: { madonhang: maDonHang },
    signal: opts.signal,
  });
  return pickList(res.data).map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

const update = async (id, d) => {
  const res = await api.put(`${PREFIX}/${id}`, d);
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};
// Actions
const create = async (payload) => {
  const res = await api.post(PREFIX, payload);
  return normalize(res.data);
};
const accept = async (id, diachiguihang) => {
  const res = await api.post(`${PREFIX}/${id}/accept`, { diachiguihang });
  return normalize(res.data);
};
const reject = async (id, lydo) => {
  const res = await api.post(`${PREFIX}/${id}/reject`, { lydo });
  return normalize(res.data);
};
const markReceived = async (id) => {
  const res = await api.post(`${PREFIX}/${id}/mark-received`);
  return normalize(res.data);
};
const markInvalid = async (id, ghichu) => {
  const res = await api.post(`${PREFIX}/${id}/mark-invalid`, { ghichu });
  return normalize(res.data);
};
const markValid = async (id) => {
  const res = await api.post(`${PREFIX}/${id}/mark-valid`);
  return normalize(res.data);
};
const calcRefund = async (id) => {
  const res = await api.post(`${PREFIX}/${id}/calc-refund`);
  return normalize(res.data);
};
// Initiate a refund (creates a pending refund record). Returns the pending record (raw).
const initiateRefund = async (id, phuongthuc, opts = {}) => {
  const res = await api.post(`${PREFIX}/${id}/refund`, { phuongthuc, ...opts });
  return res.data;
};

// Confirm a pending refund (admin action) by providing external transaction id
const confirmRefund = async (id, external_txn_id) => {
  const res = await api.post(`${PREFIX}/${id}/confirm-refund`, { external_txn_id });
  return res.data;
};

// Backwards-compatible alias
const refund = initiateRefund;

const getLogs = async (id) => {
  const res = await api.get(`${PREFIX}/${id}/logs`);
  return Array.isArray(res.data) ? res.data : [];
};

const refundPreview = async (id) => {
  const res = await api.get(`${PREFIX}/${id}/refund-preview`);
  return res.data;
};

export default { getAll, getByOrder, getById, update, delete: remove, create, accept, reject, markReceived, markInvalid, markValid, calcRefund, refund, getLogs, refundPreview };
