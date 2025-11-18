import api from "./api";

// DB (snake_case) -> UI (camelCase)
const normalize = (r) => ({
  maChotCa: r.machotca ?? r.maChotCa ?? r.id,
  maNhanVien: r.manhanvien ?? r.maNhanVien ?? null,
  ngayChotCa: r.ngaychotca ?? r.ngayChotCa ?? null, // ISO string / date
  tongThu: r.tongthu ?? r.tongThu ?? 0, // number
  tienMat: r.tienmat ?? r.tienMat ?? 0, // number
  tienChi: r.tienchi ?? r.tienChi ?? 0, // number
  tienChuyenKhoan: r.tienchuyenkhoan ?? r.tienChuyenKhoan ?? 0, // number
  soLuongDonHang: r.soluongdonhang ?? r.soLuongDonHang ?? 0, // integer
  chenhLechTienMat: r.chenhlechtienmat ?? r.chenhLechTienMat ?? null, // number
  ghiChu: r.ghichu ?? r.ghiChu ?? null, // string
  nguoiDuyet: r.nguoiduyet ?? r.nguoiDuyet ?? null, // integer
  ngayDuyet: r.ngayduyet ?? r.ngayDuyet ?? null, // ISO string / datetime
  trangThai: r.trangthai ?? r.trangThai ?? 'Chờ duyệt', // string
});

const PREFIX = "/chotca";

const pickList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.result)) return raw.result;
  return [];
};

// Lấy tất cả (có thể truyền params như manhanvien, ngaychotca, trangthai...)
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
    manhanvien: d.maNhanVien,
    ngaychotca: d.ngayChotCa,
    tongthu: d.tongThu ?? 0,
    tienmat: d.tienMat ?? 0,
    tienchi: d.tienChi ?? 0,
    tienchuyenkhoan: d.tienChuyenKhoan ?? 0,
    soluongdonhang: d.soLuongDonHang ?? 0,
    chenhlechtienmat: d.chenhLechTienMat ?? null,
    ghichu: d.ghiChu ?? null,
    trangthai: d.trangThai ?? 'Chờ duyệt',
  });
  return normalize(res.data);
};

const update = async (id, d) => {
  const res = await api.put(`${PREFIX}/${id}`, {
    tongthu: d.tongThu,
    tienmat: d.tienMat,
    tienchi: d.tienChi,
    tienchuyenkhoan: d.tienChuyenKhoan,
    soluongdonhang: d.soLuongDonHang,
    chenhlechtienmat: d.chenhLechTienMat,
    ghichu: d.ghiChu,
    nguoiduyet: d.nguoiDuyet,
    ngayduyet: d.ngayDuyet,
    trangthai: d.trangThai,
  });
  return normalize(res.data);
};

// Phê duyệt chốt ca
const approve = async (id, nguoiDuyet, ghiChu = null) => {
  const res = await api.put(`${PREFIX}/${id}`, {
    nguoiduyet: nguoiDuyet,
    ngayduyet: new Date().toISOString(),
    trangthai: 'Đã duyệt',
    ghichu: ghiChu,
  });
  return normalize(res.data);
};

// Từ chối chốt ca
const reject = async (id, nguoiDuyet, ghiChu) => {
  const res = await api.put(`${PREFIX}/${id}`, {
    nguoiduyet: nguoiDuyet,
    ngayduyet: new Date().toISOString(),
    trangthai: 'Từ chối',
    ghichu: ghiChu,
  });
  return normalize(res.data);
};

// Hủy chốt ca (quản lý)
const cancel = async (id, nguoiDuyet, ghiChu = null) => {
  const res = await api.put(`${PREFIX}/${id}`, {
    nguoiduyet: nguoiDuyet,
    ngayduyet: new Date().toISOString(),
    trangthai: 'Đã hủy',
    ghichu: ghiChu,
  });
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

// Helper functions

// Tính tổng thu từ tiền mặt và chuyển khoản, trừ đi tiền chi
const tinhTongThu = (tienMat, tienChuyenKhoan, tienChi = 0) => {
  return (tienMat || 0) + (tienChuyenKhoan || 0) - (tienChi || 0);
};

// Tính chênh lệch tiền mặt (so với thực tế)
const tinhChenhLech = (tienMatThucTe, tienMatHeThong) => {
  return (tienMatThucTe || 0) - (tienMatHeThong || 0);
};

// Kiểm tra có thể chỉnh sửa không (chỉ khi chưa duyệt)
const coTheChinhSua = (trangThai) => {
  return trangThai === 'Chờ duyệt';
};

// Lấy màu sắc theo trạng thái
const getMauTrangThai = (trangThai) => {
  switch (trangThai) {
    case 'Chờ duyệt':
      return 'yellow';
    case 'Đã duyệt':
      return 'green';
    case 'Từ chối':
      return 'red';
    default:
      return 'gray';
  }
};

// Format thời gian làm việc
const formatThoiGianLamViec = (gioBatDau, gioKetThuc) => {
  if (!gioBatDau || !gioKetThuc) return '';
  
  const batDau = new Date(gioBatDau);
  const ketThuc = new Date(gioKetThuc);
  
  const formatGio = (date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  return `${formatGio(batDau)} - ${formatGio(ketThuc)}`;
};

export default { 
  getAll, 
  getById, 
  create, 
  update, 
  approve, 
  reject, 
  cancel,
  delete: remove,
  // Helper functions
  tinhTongThu,
  tinhChenhLech,
  coTheChinhSua,
  getMauTrangThai,
  formatThoiGianLamViec,
};