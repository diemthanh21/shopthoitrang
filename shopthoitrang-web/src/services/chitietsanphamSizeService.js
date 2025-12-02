// src/services/chitietsanphamSizeService.js
import api from "./api";

const PREFIX = "/chitietsanphamsize";

// Chuẩn hoá dữ liệu từ API về camelCase cho FE
const normalize = (r = {}) => ({
  id: r.id ?? r.machitietsanpham_kichthuoc ?? r.maChiTietSanPhamKichThuoc,
  maChiTietSanPham: r.machitietsanpham ?? r.maChiTietSanPham,
  maKichThuoc: r.makichthuoc ?? r.maKichThuoc,
  tenKichThuoc:
    r.ten_kichthuoc ??
    r.tenKichThuoc ??
    r.kichthuocs?.ten_kichthuoc ??
    r.kichthuocs?.tenKichThuoc ??
    "",
  soLuong: r.so_luong ?? r.soLuong ?? 0,
  moTa: r.mo_ta ?? r.moTa ?? "",
  kichthuocs: r.kichthuocs
    ? {
        maKichThuoc: r.kichthuocs.makichthuoc ?? r.kichthuocs.maKichThuoc,
        tenKichThuoc: r.kichthuocs.ten_kichthuoc ?? r.kichthuocs.tenKichThuoc,
        moTa: r.kichthuocs.mo_ta ?? r.kichthuocs.moTa,
      }
    : null,
});

// Lấy size theo mã chi tiết sản phẩm
const getByChiTietSanPham = async (maChiTietSanPham) => {
  if (!maChiTietSanPham) return [];
  const res = await api.get(PREFIX, { params: { productDetailId: maChiTietSanPham } });
  const raw = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
  return raw.map(normalize);
};

// Cập nhật tồn kho (upsert) theo cặp maChiTietSanPham + maKichThuoc
const upsertStock = async (maChiTietSanPham, maKichThuoc, soLuong) => {
  const payload = {
    machitietsanpham: maChiTietSanPham,
    makichthuoc: maKichThuoc,
    so_luong: soLuong,
  };
  const res = await api.post(`${PREFIX}/upsert/by-unique`, payload);
  return normalize(res.data);
};

export default {
  getByChiTietSanPham,
  upsertStock,
};
