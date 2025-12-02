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
  // Thêm các trường mới
  ngayDuyet: r.ngayduyet ?? r.ngayDuyet ?? null,
  ngayNhanHang: r.ngaynhanhang ?? r.ngayNhanHang ?? null,
  ngayKiemTra: r.ngaykiemtra ?? r.ngayKiemTra ?? null,
  trangThaiKiemTra: r.trangthaikiemtra ?? r.trangThaiKiemTra ?? null,
  soTienHoan: r.sotien_hoan ?? r.soTienHoan ?? null,
  phuongThucHoan: r.phuongthuc_hoan ?? r.phuongThucHoan ?? null,
  ngayHoanTien: r.ngayhoantien ?? r.ngayHoanTien ?? null,
  maNhanVien: r.manhanvien ?? r.maNhanVien ?? null,
  nguonTao: r.nguon_tao ?? r.nguonTao ?? null, // Thêm nguồn tạo
  tenSanPham: r.tensanpham ?? r.tenSanPham ?? null, // Thêm tên sản phẩm
  // Các trường khác
  lyDoTuChoi: r.ly_do_tu_choi ?? r.lyDoTuChoi ?? null,
  lyDoKhongHopLe: r.ly_do_khong_hop_le ?? r.lyDoKhongHopLe ?? null,
  diaChiGuiHang: r.diachiguihang ?? r.diaChiGuiHang ?? null,
  huongDanDongGoi: r.huongdan_donggoi ?? r.huongDanDongGoi ?? null,
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
  // Map camelCase to snake_case for backend
  const body = {
    madonhang: Number(payload.maDonHang),
    makhachhang: Number(payload.maKhachHang),
    machitietsanpham: Number(payload.maChiTietSanPham),
    soluong: Number(payload.soLuong),
    lydo: payload.lyDo,
    hinhanhloi: payload.hinhAnhLoi || null,
    nguon_tao: 'WEB', // Đánh dấu tạo từ web để backend xử lý trực tiếp
    manhanvien: payload.maNhanVien ? Number(payload.maNhanVien) : null, // Mã nhân viên tạo
    ghichu: payload.ghiChu || null, // Ghi chú
  };
  
  console.log('[trahangService.create] Sending to backend:', body);
  
  const res = await api.post(PREFIX, body);
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
const refund = async (id, phuongthuc) => {
  const res = await api.post(`${PREFIX}/${id}/refund`, { phuongthuc });
  return normalize(res.data);
};

const getLogs = async (id) => {
  const res = await api.get(`${PREFIX}/${id}/logs`);
  return Array.isArray(res.data) ? res.data : [];
};

const refundPreview = async (id) => {
  const res = await api.get(`${PREFIX}/${id}/refund-preview`);
  return res.data;
};

export default { getAll, getById, update, delete: remove, create, accept, reject, markReceived, markInvalid, markValid, calcRefund, refund, getLogs, refundPreview };
