import api from './api';

const PREFIX = '/doihang';

const mapVariant = (v) => {
  if (!v) return null;
  return {
    id: v.machitietsanpham ?? v.id,
    productId: v.masanpham ?? v.maSanPham ?? null,
    productName: v.tensanpham ?? v.tenSanPham ?? v.productName ?? null,
    size: v.kichthuoc ?? v.kichThuoc ?? null,
    color: v.mausac ?? v.mauSac ?? null,
    material: v.chatlieu ?? v.chatLieu ?? null,
    description: v.mota ?? v.moTa ?? null,
    price: v.giaban ?? v.giaBan ?? null,
  };
};

const normalize = (r) => ({
  id: r.madoihang ?? r.id,
  maDoiHang: r.madoihang ?? r.id,
  maDonHang: r.madonhang,
  maKhachHang: r.makhachhang,
  maChiTietSanPhamCu: r.machitietsanphamcu,
  maChiTietSanPhamMoi: r.machitietsanphammoi,
  soLuong: r.soluong,
  lyDo: r.lydo,
  ngayYeuCau: r.ngayyeucau,
  trangThai: r.trangthai,
  ghiChu: r.ghichu,
  giacu: r.giacu,
  giamoi: r.giamoi,
  chenhlech: r.chenhlech,
  trangThaiTien: r.trangthaitien,
  phuongThucXuLyChenhLech: r.phuongthuc_xuly_chenhlech,
  maDonHangMoi: r.madonhangmoi,
  ngayTaoDonMoi: r.ngaytaodonmoi,
  diaChiGuiHangCu: r.diachiguihang,
  huongDanDongGoi: r.huongdan_donggoi ?? r.huongdan,
  ngayDuyet: r.ngayduyet,
  ngayNhanHangCu: r.ngaynhanhangcu,
  ngayKiemTra: r.ngaykiemtra,
  trangThaiKiemTra: r.trangthaikiemtra,
  voucherCode: r.voucher_code,
  voucherAmount: r.voucher_amount,
  variantCu: mapVariant(r.variantCu || r.variant_cu),
  variantMoi: mapVariant(r.variantMoi || r.variant_moi),
});

const pickList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
};

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  return pickList(res.data).map(normalize);
};
const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};
const getByCustomer = async (makhachhang) => {
  const res = await api.get(`${PREFIX}/khachhang/${makhachhang}`);
  return pickList(res.data).map(normalize);
};
const create = async (payload) => {
  const res = await api.post(PREFIX, payload);
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

// Workflow actions
const accept = async (id, diachiguihang, huongdan) => normalize((await api.post(`${PREFIX}/${id}/accept`, { diachiguihang, huongdan })).data);
const reject = async (id, lydo) => normalize((await api.post(`${PREFIX}/${id}/reject`, { lydo })).data);
const markReceivedOld = async (id) => normalize((await api.post(`${PREFIX}/${id}/mark-received-old`)).data);
const markInvalid = async (id, ghichu) => normalize((await api.post(`${PREFIX}/${id}/mark-invalid`, { ghichu })).data);
const markValid = async (id) => normalize((await api.post(`${PREFIX}/${id}/mark-valid`)).data);
const calcDiff = async (id) => normalize((await api.post(`${PREFIX}/${id}/calc-diff`)).data);
const requestExtraPayment = async (id) => normalize((await api.post(`${PREFIX}/${id}/request-extra-payment`)).data);
const confirmExtraPaid = async (id) => normalize((await api.post(`${PREFIX}/${id}/confirm-extra-paid`)).data);
const refundDifference = async (id, method) => normalize((await api.post(`${PREFIX}/${id}/refund-difference`, { method })).data);
const createNewOrder = async (id) => normalize((await api.post(`${PREFIX}/${id}/create-new-order`)).data);
const complete = async (id) => normalize((await api.post(`${PREFIX}/${id}/complete`)).data);
const syncComplete = async (id) => normalize((await api.post(`${PREFIX}/${id}/sync-complete`)).data);
const getLogs = async (id) => {
  const res = await api.get(`${PREFIX}/${id}/logs`);
  return Array.isArray(res.data) ? res.data : [];
};
const diffPreview = async (id) => {
  const res = await api.get(`${PREFIX}/${id}/diff-preview`);
  return res.data;
};

export default {
  getAll,
  getById,
  getByCustomer,
  create,
  update,
  delete: remove,
  accept,
  reject,
  markReceivedOld,
  markInvalid,
  markValid,
  calcDiff,
  confirmExtraPaid,
  requestExtraPayment,
  refundDifference,
  createNewOrder,
  complete,
  syncComplete,
  getLogs,
  diffPreview,
};
