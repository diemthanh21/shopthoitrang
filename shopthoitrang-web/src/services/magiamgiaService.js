// src/services/magiamgiaService.js
import api from "./api";

const PREFIX = "/magiamgia";

const pickList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.result)) return raw.result;
  return [];
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalize = (record = {}) => {
  const start = record.ngaybatdau ?? record.ngayBatDau ?? null;
  const end = record.ngayketthuc ?? record.ngayKetThuc ?? null;
  const soLuong = record.soluong ?? record.soLuong ?? 0;

  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const today = new Date();
  const isInRange =
    startDate && endDate
      ? today >= startDate && today <= endDate
      : false;

  return {
    maVoucher: record.mavoucher ?? record.maVoucher ?? null,
    maCode: record.macode ?? record.maCode ?? "",
    maDonHang: record.madonhang ?? record.maDonHang ?? null,
    moTa: record.mota ?? record.moTa ?? "",
    giaTriGiam: record.giatrigiam ?? record.giaTriGiam ?? 0,
    soLuong,
    ngayBatDau: start,
    ngayKetThuc: end,
    maNhanVien: record.manhanvien ?? record.maNhanVien ?? null,
    isActive: isInRange && Number(soLuong) > 0,
  };
};

const stripUndefined = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  );

const toDB = (voucher = {}) =>
  stripUndefined({
    macode: voucher.macode ?? voucher.maCode,
    madonhang: voucher.madonhang ?? voucher.maDonHang ?? null,
    mota: voucher.mota ?? voucher.moTa ?? null,
    giatrigiam: voucher.giatrigiam ?? voucher.giaTriGiam,
    soluong: voucher.soluong ?? voucher.soLuong,
    ngaybatdau: voucher.ngaybatdau ?? voucher.ngayBatDau,
    ngayketthuc: voucher.ngayketthuc ?? voucher.ngayKetThuc,
    manhanvien: voucher.manhanvien ?? voucher.maNhanVien,
  });

const getAll = async (params = {}) => {
  const res = await api.get(PREFIX, { params });
  const list = pickList(res.data);
  return list.map(normalize);
};

const getById = async (id) => {
  const res = await api.get(`${PREFIX}/${id}`);
  return normalize(res.data);
};

const create = async (data) => {
  const payload = toDB(data);
  const res = await api.post(PREFIX, payload);
  return normalize(res.data);
};

const update = async (id, data) => {
  const payload = toDB(data);
  const res = await api.put(`${PREFIX}/${id}`, payload);
  return normalize(res.data);
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default {
  getAll,
  getById,
  create,
  update,
  delete: remove,
};
