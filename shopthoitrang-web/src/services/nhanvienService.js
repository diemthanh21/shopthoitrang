import api from "./api";

// Chuẩn hóa dữ liệu trả về từ API về camelCase
const normalize = (r) => ({
  maNhanVien: r.manhanvien ?? r.maNhanVien ?? r.id,
  hoTen: r.hoten ?? r.hoTen ?? "",
  gioiTinh: r.gioitinh ?? r.gioiTinh ?? null,
  cccd: r.cccd ?? null,
  ngayCap: r.ngaycap ?? r.ngayCap ?? null,
  noiCap: r.noicap ?? r.noiCap ?? null,
  ngayBatDau: r.ngaybatdau ?? r.ngayBatDau ?? null,
  ngayHetHan: r.ngayhethan ?? r.ngayHetHan ?? null,
  trangThai: r.trangthai ?? r.trangThai ?? null,
  luong: r.luong ?? null,
  email: r.email ?? null,
  soDienThoai: r.sodienthoai ?? r.soDienThoai ?? null,
  ngaySinh: r.ngaysinh ?? r.ngaySinh ?? null,
  diaChi: r.diachi ?? r.diaChi ?? null,
  maChucNang: r.machucnang ?? r.maChucNang ?? null,
  maQuanLy: r.maquanly ?? r.maQuanLy ?? null,
});

const PREFIX = "/nhanvien";

// Helper: convert date to ISO format
function toISODate(v) {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00`;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// Helper: convert to number or null
function numOrNull(v) {
  return v === "" || v == null ? null : Number(v);
}

// Map field names gửi lên API
function buildBody(data) {
  return {
    hoten: data.hoten ?? data.hoTen ?? null,
    gioitinh: data.gioitinh ?? data.gioiTinh ?? null,
    cccd: data.cccd ?? null,
    ngaycap: toISODate(data.ngaycap ?? data.ngayCap) ?? null,
    noicap: data.noicap ?? data.noiCap ?? null,
    ngaybatdau: toISODate(data.ngaybatdau ?? data.ngayBatDau) ?? null,
    ngayhethan: toISODate(data.ngayhethan ?? data.ngayHetHan) ?? null,
    trangthai: data.trangthai ?? data.trangThai ?? null,
    luong: data.luong ?? null,
    email: data.email ?? null,
    sodienthoai: data.sodienthoai ?? data.soDienThoai ?? null,
    ngaysinh: toISODate(data.ngaysinh ?? data.ngaySinh) ?? null,
    diachi: data.diachi ?? data.diaChi ?? null,
    machucnang: numOrNull(data.machucnang ?? data.maChucNang),
    maquanly: numOrNull(data.maquanly ?? data.maQuanLy),
  };
}

// ========== CRUD ==========

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
  const body = buildBody(data);
  if (!body.hoten) throw new Error("Thiếu họ tên");
  if (!body.machucnang) throw new Error("Thiếu chức năng");
  const res = await api.post(PREFIX, body);
  return normalize(res.data);
};

const update = async (id, data) => {
  const body = buildBody(data);
  const res = await api.put(`${PREFIX}/${id}`, body);
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};


export default { getAll, getById, create, update, delete: remove };
