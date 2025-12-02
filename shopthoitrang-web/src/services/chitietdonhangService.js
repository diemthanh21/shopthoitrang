// src/services/chitietdonhangService.js
import api from "./api";

// DB (snake_case) -> UI (camelCase)
const normalize = (r) => ({
  maChiTietDonHang: r.machitietdonhang ?? r.maChiTietDonHang ?? r.id,
  maDonHang: r.madonhang ?? r.maDonHang ?? null,
  maChiTietSanPham:
    r.machitietsanpham ??
    r.maChiTietSanPham ??
    r.variantId ??
    r.machitietsanpham,
  soLuong: r.soluong ?? r.soLuong ?? 0,
  donGia: r.dongia ?? r.donGia ?? 0,
  chiTietSizeId:
    r.chitietsize_id ??
    r.chiTietSizeId ??
    r.sizeBridgeId ??
    null,

  // Nếu backend có enrich thêm
  productName: r.productName ?? r.tensanpham ?? r.tenSanPham ?? undefined,
  variant: r.variant ?? {
    color: r.mausac ?? undefined,
    size: r.kichthuoc ?? undefined,
    price: r.price ?? undefined,
  },
  imageUrl: r.imageUrl ?? r.hinhAnh ?? undefined,
  thanhTien:
    r.thanhTien ??
    (r.soluong || r.soLuong || 0) * (r.dongia || r.donGia || 0),
  promotion: r.promotion || undefined,
});

const PREFIX = "/chitietdonhang";

const pickList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.result)) return raw.result;
  return [];
};

/**
 * Lấy tất cả chi tiết đơn hàng (có thể truyền params như madonhang, q...)
 */
const getAll = async (params = {}, opts = {}) => {
  const res = await api.get(PREFIX, { params, signal: opts.signal });
  return pickList(res.data).map(normalize);
};

/**
 * Lấy chi tiết đơn hàng theo ID (machitietdonhang)
 */
const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

/**
 * Lấy danh sách chi tiết theo mã đơn hàng (madonhang)
 * Backend nên hỗ trợ query: GET /chitietdonhang?madonhang=123
 */
const getByOrderId = async (maDonHang, opts = {}) => {
  const res = await api.get(PREFIX, {
    params: { madonhang: maDonHang },
    signal: opts.signal,
  });
  return pickList(res.data).map(normalize);
};

/**
 * Tạo mới 1 dòng chi tiết đơn hàng
 * d dự kiến dạng:
 * {
 *   maDonHang,
 *   maChiTietSanPham,
 *   soLuong,
 *   donGia,
 *   chiTietSizeId / chitietsize_id / sizeBridgeId
 * }
 */
const create = async (d) => {
  const payload = {
    madonhang: d.maDonHang ?? d.madonhang,
    machitietsanpham:
      d.maChiTietSanPham ??
      d.machitietsanpham ??
      d.variantId ??
      d.selectedVariant?.machitietsanpham,
    soluong: d.soLuong ?? d.soluong ?? 0,
    dongia: d.donGia ?? d.dongia ?? 0,
    chitietsize_id:
      d.chitietsize_id ??
      d.chiTietSizeId ??
      d.sizeBridgeId ??
      d.maChiTietSanPhamKichThuoc ??
      d.selectedVariant?.maChiTietSanPhamKichThuoc ??
      null,
  };

  console.log("[chitietdonhangService.create] Payload:", payload);

  const res = await api.post(PREFIX, payload);
  return normalize(res.data);
};

/**
 * Cập nhật 1 dòng chi tiết đơn hàng
 */
const update = async (id, d) => {
  const payload = {
    madonhang: d.maDonHang ?? d.madonhang,
    machitietsanpham:
      d.maChiTietSanPham ??
      d.machitietsanpham ??
      d.variantId ??
      d.selectedVariant?.machitietsanpham,
    soluong: d.soLuong ?? d.soluong ?? 0,
    dongia: d.donGia ?? d.dongia ?? 0,
    chitietsize_id:
      d.chitietsize_id ??
      d.chiTietSizeId ??
      d.sizeBridgeId ??
      d.maChiTietSanPhamKichThuoc ??
      d.selectedVariant?.maChiTietSanPhamKichThuoc ??
      null,
  };

  console.log("[chitietdonhangService.update] Payload:", payload);

  const res = await api.put(`${PREFIX}/${id}`, payload);
  return normalize(res.data);
};

/**
 * Xoá 1 dòng chi tiết đơn hàng
 */
const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default {
  getAll,
  getById,
  getByOrderId,
  create,
  update,
  delete: remove,
};
