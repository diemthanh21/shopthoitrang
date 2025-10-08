import api from "./api";

// Map đúng tất cả field hiện có trong model (không thêm gì khác)
const normalize = (r) => ({
  maNhanVien: r.manhanvien ?? r.maNhanVien ?? r.id,
  hoTen: r.hoten ?? r.hoTen ?? "",
  email: r.email ?? null,
  soDienThoai: r.sodienthoai ?? r.soDienThoai ?? null,
  ngaySinh: r.ngaysinh ?? r.ngaySinh ?? null,
  diaChi: r.diachi ?? r.diaChi ?? null,
  maChucNang: r.machucnang ?? r.maChucNang ?? null,
  maQuanLy: r.maquanly ?? r.maQuanLy ?? null,
});

const PREFIX = "/nhanvien";

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
  const body = {
    hoten: data.hoTen,
    email: data.email ?? null,
    sodienthoai: data.soDienThoai ?? null,
    ngaysinh: data.ngaySinh ?? null,
    diachi: data.diaChi ?? null,
    machucnang: data.maChucNang,
    maquanly: data.maQuanLy ?? null,
  };
  const res = await api.post(PREFIX, body);
  return normalize(res.data);
};

const update = async (id, data) => {
  const body = {
    hoten: data.hoTen,
    email: data.email ?? null,
    sodienthoai: data.soDienThoai ?? null,
    ngaysinh: data.ngaySinh ?? null,
    diachi: data.diaChi ?? null,
    machucnang: data.maChucNang,
    maquanly: data.maQuanLy ?? null,
  };
  const res = await api.put(`${PREFIX}/${id}`, body);
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default { getAll, getById, create, update, delete: remove };
