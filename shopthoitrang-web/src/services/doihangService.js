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

const parseEvidence = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  const raw = value.toString().trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (_) {
    if (raw.startsWith('http')) return { imageEvidence: raw };
  }
  return null;
};

const mapDetail = (detail) => {
  const evidence = parseEvidence(detail.hinhanh || detail.media || detail.evidence);
  return {
    id: detail.mactdoihang ?? detail.id,
    maChiTietSanPhamCu: detail.machitietsanphamcu ?? detail.maChiTietSanPhamCu,
    maChiTietSanPhamMoi: detail.machitietsanphammoi ?? detail.maChiTietSanPhamMoi,
    soLuong: detail.soluong ?? detail.soLuong,
    lyDo: detail.lydo ?? detail.lyDo,
    hinhAnh: detail.hinhanh || null,
    variantCu: mapVariant(detail.variantCu || detail.variant_cu),
    variantMoi: mapVariant(detail.variantMoi || detail.variant_moi),
    evidence,
  };
};

const normalize = (r) => {
  const rawDetails = Array.isArray(r.items) && r.items.length ? r.items : r.chitietdoihang || [];
  const details = rawDetails.map(mapDetail);
  const primary = details[0] || {};
  let imageCount = 0;
  let videoCount = 0;
  const attachments = [];
  const appendMedia = (value, type) => {
    if (!value) return;
    const list = Array.isArray(value) ? value : [value];
    list.forEach((entry) => {
      if (typeof entry !== 'string') return;
      const url = entry.trim();
      if (!url) return;
      if (type === 'image') {
        imageCount += 1;
        attachments.push({
          type: 'image',
          url,
          label: `Ảnh minh chứng #${imageCount}`,
        });
      } else {
        videoCount += 1;
        attachments.push({
          type: 'video',
          url,
          label: `Video minh chứng #${videoCount}`,
        });
      }
    });
  };
  details.forEach((detail) => {
    const ev = detail.evidence;
    if (!ev) return;
    appendMedia(ev.imageEvidence, 'image');
    appendMedia(ev.videoEvidence, 'video');
  });

  return {
    id: r.madoihang ?? r.id,
    maDoiHang: r.madoihang ?? r.id,
    maDonHang: r.madonhang,
    maKhachHang: r.makhachhang ?? r.maKhachHang ?? null,
    maChiTietSanPhamCu: r.machitietsanphamcu ?? primary.maChiTietSanPhamCu,
    maChiTietSanPhamMoi: r.machitietsanphammoi ?? primary.maChiTietSanPhamMoi,
    soLuong: r.soluong ?? primary.soLuong,
    lyDo: r.lydo ?? primary.lyDo,
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
    variantCu: mapVariant(r.variantCu || r.variant_cu) || primary.variantCu,
    variantMoi: mapVariant(r.variantMoi || r.variant_moi) || primary.variantMoi,
    items: details.length ? details : [
      {
        id: null,
        maChiTietSanPhamCu: r.machitietsanphamcu,
        maChiTietSanPhamMoi: r.machitietsanphammoi,
        soLuong: r.soluong,
        lyDo: r.lydo,
        variantCu: mapVariant(r.variantCu || r.variant_cu),
        variantMoi: mapVariant(r.variantMoi || r.variant_moi),
        evidence: parseEvidence(r.ghichu),
      },
    ],
    attachments,
  };
};

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
const markInvalid = async (id, note) =>
  normalize((await api.post(`${PREFIX}/${id}/mark-invalid`, { note })).data);
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
