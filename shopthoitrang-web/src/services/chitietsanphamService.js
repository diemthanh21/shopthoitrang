// src/services/chitietsanphamService.js
import api from "./api";

// Chuẩn hoá từ DB -> UI
const normalize = (r) => ({
  maChiTietSanPham: r.machitietsanpham ?? r.maChiTietSanPham ?? r.id,
  maSanPham: r.masanpham ?? r.maSanPham ?? null,
  kichThuoc: r.kichthuoc ?? r.kichThuoc ?? "",
  mauSac: r.mausac ?? r.mauSac ?? "",
  chatLieu: r.chatlieu ?? r.chatLieu ?? "",
  moTa: r.mota ?? r.moTa ?? "",
  giaBan: r.giaban ?? r.giaBan ?? 0,
  soLuongTon: r.soluongton ?? r.soLuongTon ?? 0,
});

// UI -> DB
const toDB = (d) => ({
  masanpham: d.maSanPham ?? d.masanpham,
  kichthuoc: d.kichThuoc ?? d.kichthuoc,
  mausac: d.mauSac ?? d.mausac,
  chatlieu: d.chatLieu ?? d.chatlieu ?? null,
  mota: d.moTa ?? d.mota ?? null,
  giaban: d.giaBan ?? d.giaban ?? 0,
  soluongton: d.soLuongTon ?? d.soluongton ?? 0,
});

const PREFIX = "/chitietsanpham";

// Hàm hỗ trợ bóc mảng từ nhiều dạng response khác nhau
const extractArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (raw && typeof raw === "object") return [raw];
  return [];
};

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const arr = extractArray(res.data);
  return arr.map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

// ===== FIX: Lấy tất cả chi tiết theo mã sản phẩm =====
const getByProductId = async (maSanPham) => {
  console.log("🔍 Fetching variants for product:", maSanPham);
  
  // Thử nhiều cách query để tương thích với backend
  try {
    // Cách 1: Query với param masanpham (lowercase)
    let res = await api.get(PREFIX, {
      params: { masanpham: maSanPham },
    });
    
    console.log("📡 API Response (masanpham):", res.data);
    
    let arr = extractArray(res.data);
    
    // Nếu không có kết quả, thử cách 2
    if (arr.length === 0) {
      console.log("⚠️ No results with 'masanpham', trying 'maSanPham'...");
      res = await api.get(PREFIX, {
        params: { maSanPham: maSanPham },
      });
      console.log("📡 API Response (maSanPham):", res.data);
      arr = extractArray(res.data);
    }
    
    // Nếu vẫn không có, thử lấy tất cả rồi filter
    if (arr.length === 0) {
      console.log("⚠️ No results with params, fetching all and filtering...");
      res = await api.get(PREFIX);
      const allArr = extractArray(res.data);
      console.log("📡 All variants:", allArr.length);
      
      // Filter theo maSanPham
      arr = allArr.filter(item => {
        const itemMaSP = item.masanpham ?? item.maSanPham;
        return Number(itemMaSP) === Number(maSanPham);
      });
      console.log("📦 Filtered variants:", arr.length);
    }
    
    const normalized = arr.map(normalize);
    console.log("✅ Returning normalized variants:", normalized);
    return normalized;
    
  } catch (error) {
    console.error("❌ Error in getByProductId:", error);
    throw error;
  }
};

const create = async (data) => {
  console.log("➕ Creating variant with data:", data);
  const payload = toDB(data);
  console.log("➕ Payload to DB:", payload);
  
  const res = await api.post(PREFIX, payload);
  console.log("➕ Create response:", res.data);
  
  return normalize(res.data);
};

const update = async (id, data) => {
  console.log("✏️ Updating variant:", id, "with data:", data);
  const payload = toDB(data);
  console.log("✏️ Payload to DB:", payload);
  
  const res = await api.put(`${PREFIX}/${id}`, payload);
  console.log("✏️ Update response:", res.data);
  
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default {
  getAll,
  getById,
  getByProductId,
  create,
  update,
  delete: remove,
};