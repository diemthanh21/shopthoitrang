// src/services/bannerService.js
import api from "./api";

const normalize = (r) => ({
  maBanner: r.mabanner ?? r.maBanner ?? r.id,
  duongDanAnh: r.duongdananh ?? r.duongDanAnh ?? "",
  moTa: r.mota ?? r.moTa ?? null,
  // lienKet removed
  thuTuHienThi: r.thutuhienthi ?? r.thuTuHienThi ?? null,
  dangHoatDong: typeof r.danghoatdong === "boolean" ? r.danghoatdong : !!r.dangHoatDong,
});

const toDB = (b) => ({
  mabanner: b.maBanner ?? undefined,
  duongdananh: b.duongDanAnh,
  mota: b.moTa ?? null,
  // lienket removed
  thutuhienthi: b.thuTuHienThi ?? null,
  danghoatdong: typeof b.dangHoatDong === "boolean" ? b.dangHoatDong : true,
});

const PREFIX = "/banner";

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const raw = res.data;

  let list = [];
  if (Array.isArray(raw)) list = raw;
  else if (Array.isArray(raw?.data)) list = raw.data;
  else if (Array.isArray(raw?.items)) list = raw.items;           // phòng trường hợp backend trả {items: []}
  else if (Array.isArray(raw?.result)) list = raw.result;         // hoặc {result: []}
  // nếu không có mảng, trả mảng rỗng để tránh .map lỗi

  return list.map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};
const create = async (data) => {
  const res = await api.post(PREFIX, toDB(data));
  return normalize(res.data);
};
const update = async (id, data) => {
  const res = await api.put(`${PREFIX}/${id}`, toDB(data));
  return normalize(res.data);
};
const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default { getAll, getById, create, update, delete: remove };
