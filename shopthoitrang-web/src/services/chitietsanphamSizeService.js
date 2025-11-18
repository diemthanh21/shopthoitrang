// src/services/chitietsanphamSizeService.js
import api from "./api";

// Chuẩn hoá dữ liệu từ API về dạng camelCase dùng trong FE
const normalize = (r = {}) => ({
  id: r.id ?? r.machitietsanpham_kichthuoc ?? r.maChiTietSanPhamKichThuoc,
  maChiTietSanPham: r.machitietsanpham ?? r.maChiTietSanPham,
  maKichThuoc: r.makichthuoc ?? r.maKichThuoc,
  tenKichThuoc: r.ten_kichthuoc ?? r.tenKichThuoc ?? "",
  soLuong: r.so_luong ?? r.soLuong ?? 0,
  moTa: r.mo_ta ?? r.moTa ?? "",
  // Nested data from relations
  kichthuocs: r.kichthuocs ? {
    maKichThuoc: r.kichthuocs.makichthuoc ?? r.kichthuocs.maKichThuoc,
    tenKichThuoc: r.kichthuocs.ten_kichthuoc ?? r.kichthuocs.tenKichThuoc,
    moTa: r.kichthuocs.mo_ta ?? r.kichthuocs.moTa
  } : null,
  chitietsanphams: r.chitietsanphams ? {
    maChiTietSanPham: r.chitietsanphams.machitietsanpham ?? r.chitietsanphams.maChiTietSanPham,
    maSanPham: r.chitietsanphams.masanpham ?? r.chitietsanphams.maSanPham,
    kichThuoc: r.chitietsanphams.kichthuoc ?? r.chitietsanphams.kichThuoc,
    mauSac: r.chitietsanphams.mausac ?? r.chitietsanphams.mauSac,
    chatLieu: r.chitietsanphams.chatlieu ?? r.chitietsanphams.chatLieu,
    giaBan: r.chitietsanphams.giaban ?? r.chitietsanphams.giaBan
  } : null
});

const PREFIX = "/chitietsanpham-kichthuoc";

// Lấy danh sách chi tiết sản phẩm theo kích thước
const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const raw = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
  return {
    items: raw.map(normalize),
    total: res.data?.total ?? raw.length
  };
};

// Lấy chi tiết theo ID
const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

// Lấy chi tiết theo mã chi tiết sản phẩm
const getByChiTietSanPham = async (maChiTietSanPham) => {
  const res = await api.get(`${PREFIX}/by-chitietsanpham/${maChiTietSanPham}`);
  const raw = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
  return raw.map(normalize);
};

// Lấy chi tiết theo mã kích thước
const getByKichThuoc = async (maKichThuoc) => {
  const res = await api.get(`${PREFIX}/by-kichthuoc/${maKichThuoc}`);
  const raw = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
  return raw.map(normalize);
};

// Tạo mới chi tiết sản phẩm kích thước
// data dạng DB: { machitietsanpham, makichthuoc, so_luong, mo_ta }
const create = async (data) => {
  const res = await api.post(PREFIX, data);
  return normalize(res.data);
};

// Tạo nhiều chi tiết sản phẩm kích thước
const createBulk = async (dataArray) => {
  const res = await api.post(`${PREFIX}/bulk`, { items: dataArray });
  const raw = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
  return raw.map(normalize);
};

// Cập nhật chi tiết sản phẩm kích thước
// data dạng DB: { so_luong?, mo_ta? }
const update = async (id, data) => {
  const res = await api.put(`${PREFIX}/${id}`, data);
  return normalize(res.data);
};

// Cập nhật số lượng tồn kho
const updateStock = async (id, soLuong) => {
  const res = await api.patch(`${PREFIX}/${id}/stock`, { so_luong: soLuong });
  return normalize(res.data);
};

// Cập nhật số lượng tồn kho theo mã chi tiết sản phẩm và kích thước
const updateStockByProduct = async (maChiTietSanPham, maKichThuoc, soLuong) => {
  const res = await api.patch(`${PREFIX}/stock`, { 
    machitietsanpham: maChiTietSanPham,
    makichthuoc: maKichThuoc,
    so_luong: soLuong 
  });
  return normalize(res.data);
};

// Tăng số lượng tồn kho (dùng khi nhập hàng)
const increaseStock = async (id, soLuong) => {
  const res = await api.patch(`${PREFIX}/${id}/increase-stock`, { so_luong: soLuong });
  return normalize(res.data);
};

// Giảm số lượng tồn kho (dùng khi bán hàng)
const decreaseStock = async (id, soLuong) => {
  const res = await api.patch(`${PREFIX}/${id}/decrease-stock`, { so_luong: soLuong });
  return normalize(res.data);
};

// Xoá chi tiết sản phẩm kích thước
const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

// Xoá nhiều chi tiết theo mã chi tiết sản phẩm
const removeByChiTietSanPham = async (maChiTietSanPham) => {
  const res = await api.delete(`${PREFIX}/by-chitietsanpham/${maChiTietSanPham}`);
  return res.data;
};

// Lấy thống kê tồn kho
const getStockStats = async (params = {}) => {
  const res = await api.get(`${PREFIX}/stats`, { params });
  return res.data;
};

// Lấy danh sách sản phẩm sắp hết hàng
const getLowStock = async (threshold = 10) => {
  const res = await api.get(`${PREFIX}/low-stock`, { 
    params: { threshold } 
  });
  const raw = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
  return raw.map(normalize);
};

// Kiểm tra tồn kho có đủ không
const checkStock = async (items = []) => {
  // items: [{ id, so_luong }] hoặc [{ machitietsanpham, makichthuoc, so_luong }]
  const res = await api.post(`${PREFIX}/check-stock`, { items });
  return res.data; // { available: boolean, insufficientItems: [...] }
};

// Đồng bộ tồn kho (dùng khi có sai lệch)
const syncStock = async (id) => {
  const res = await api.patch(`${PREFIX}/${id}/sync-stock`);
  return normalize(res.data);
};

export default {
  getAll,
  getById,
  getByChiTietSanPham,
  getByKichThuoc,
  create,
  createBulk,
  update,
  updateStock,
  updateStockByProduct,
  increaseStock,
  decreaseStock,
  delete: remove,
  removeByChiTietSanPham,
  getStockStats,
  getLowStock,
  checkStock,
  syncStock
};