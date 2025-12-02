// src/services/donhangService.js
import api from "./api";

// DB (snake_case) -> UI (camelCase)
const normalize = (r) => ({
  maDonHang: r.madonhang ?? r.maDonHang ?? r.id,
  maKhachHang: r.makhachhang ?? r.maKhachHang ?? null,
  maNhanVien: r.manhanvien ?? r.maNhanVien ?? null, // employee approver
  nguonDon: r.nguon_don ?? r.nguonDon ?? "MOBILE", // order source
  ngayDatHang: r.ngaydathang ?? r.ngayDatHang ?? null, // ISO string / date
  thanhTien: r.thanhtien ?? r.thanhTien ?? 0, // number
  phuongThucThanhToan: r.phuongthucthanhtoan ?? r.phuongThucThanhToan ?? null,
  trangThaiThanhToan: r.trangthaithanhtoan ?? r.trangThaiThanhToan ?? null,
  trangThaiDonHang: r.trangthaidonhang ?? r.trangThaiDonHang ?? null,
  lydohuy: r.lydohuy ?? r.lyDoHuy ?? null, // cancellation reason
  maGiamGiaInfo: r.maGiamGiaInfo || r.magiamgiainfo || undefined, // discount code details
  phiVanChuyen: r.phiVanChuyen ?? r.phivanchuyen ?? 0, // shipping fee
  // Include items if server provided them
  items: Array.isArray(r.items)
    ? r.items.map((it) => ({
        maChiTietDonHang: it.machitietdonhang ?? it.maChiTietDonHang ?? it.id,
        maDonHang: it.madonhang ?? it.maDonHang ?? null,
        maChiTietSanPham: it.machitietsanpham ?? it.maChiTietSanPham ?? null,
        soLuong: it.soluong ?? it.soLuong ?? 0,
        donGia: it.dongia ?? it.donGia ?? 0,
        // pass-through enriched fields from backend if available
        productName:
          it.productName ?? it.tensanpham ?? it.tenSanPham ?? undefined,
        variant: it.variant ?? {
          color: it.mausac ?? undefined,
          size: it.kichthuoc ?? undefined,
          price: it.price ?? undefined,
        },
        imageUrl: it.imageUrl ?? it.hinhAnh ?? undefined,
        thanhTien:
          it.thanhTien ??
          (it.soluong || it.soLuong || 0) * (it.dongia || it.donGia || 0),
        promotion: it.promotion || undefined, // khuyến mãi
      }))
    : undefined,
  // pass-through detailed customer and address if present
  khachHang: r.khachHang || r.khachhang || undefined,
  diaChi: r.diaChi || r.diachi || r.diaChiGiao || r.diachiGiao || undefined,
});

const PREFIX = "/donhang";

const pickList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.result)) return raw.result;
  return [];
};

// Lấy tất cả (có thể truyền params như status, q, from, to...)
const getAll = async (params = {}, opts = {}) => {
  const res = await api.get(PREFIX, { params, signal: opts.signal });
  return pickList(res.data).map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

const create = async (d) => {
  console.log("[donhangService.create] Input data:", {
    maNhanVien: d.maNhanVien,
    maKhachHang: d.maKhachHang,
    nguonDon: d.nguonDon,
    allKeys: Object.keys(d),
  });

  const payload = {
    makhachhang: d.maKhachHang,
    manhanvien: d.maNhanVien ?? undefined,
    nguon_don: d.nguonDon ?? undefined,
    ngaydathang: d.ngayDatHang,
    ngaygiaohang: d.ngayGiaoHang ?? d.ngayDatHang,
    thanhtien: d.thanhTien,
    phuongthucthanhtoan: d.phuongThucThanhToan,
    trangthaithanhtoan: d.trangThaiThanhToan,
    trangthaidonhang: d.trangThaiDonHang,
    phivanchuyen: d.phiVanChuyen ?? 0,
  };

  console.log("[donhangService.create] Payload manhanvien:", payload.manhanvien);
  console.log("[donhangService.create] Payload nguon_don:", payload.nguon_don);
  console.log("[donhangService.create] Full payload (before items):", payload);

  // Add address if provided
  if (d.diaChiGiao) {
    // có thể là id địa chỉ hoặc object
    payload.diaChi = d.diaChiGiao;
  }

  // Add order items if provided (send in multiple shapes để backend dễ đọc)
  if (Array.isArray(d.chiTietDonHang) && d.chiTietDonHang.length > 0) {
    const mapped = d.chiTietDonHang.map((item) => ({
      machitietsanpham:
        item.maChiTietSanPham ??
        item.machitietsanpham ??
        item.selectedVariant?.machitietsanpham ??
        item.selectedVariant?.maChiTietSanPham ??
        null,
      soluong: item.soLuong ?? item.soluong ?? 0,
      dongia: item.donGia ?? item.dongia ?? 0,
      chitietsize_id:
        item.chitietsize_id ??
        item.chiTietSizeId ??
        item.maChiTietSanPhamKichThuoc ??
        item.selectedVariant?.maChiTietSanPhamKichThuoc ??
        null,
      makichthuoc:
        item.makichthuoc ??
        item.maKichThuoc ??
        item.selectedVariant?.maKichThuoc ??
        null,
    }));

    console.log(
      "[donhangService.create] Mapped order items (for payload):",
      mapped
    );

    // BE đọc cả 3 key: items / chiTietDonHang / chitietdonhang
    payload.chiTietDonHang = mapped;
    payload.items = mapped;
    payload.chitietdonhang = mapped;
  }

  console.log("[donhangService.create] Final payload:", payload);

  const res = await api.post(PREFIX, payload);
  return normalize(res.data);
};

const update = async (id, d) => {
  const res = await api.put(`${PREFIX}/${id}`, {
    makhachhang: d.maKhachHang,
    manhanvien: d.maNhanVien ?? d.manhanvien ?? undefined,
    ngaydathang: d.ngayDatHang,
    thanhtien: d.thanhTien,
    phuongthucthanhtoan: d.phuongThucThanhToan,
    trangthaithanhtoan: d.trangThaiThanhToan,
    trangthaidonhang: d.trangThaiDonHang,
    lydohuy: d.lydohuy ?? d.lyDoHuy ?? undefined,
  });
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default { getAll, getById, create, update, delete: remove };
