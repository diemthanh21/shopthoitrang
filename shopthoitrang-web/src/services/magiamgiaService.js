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
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toDateOnlyString = (value) => {
  const d = parseDate(value);
  if (!d) return "";
  // yyyy-mm-dd
  return d.toISOString().slice(0, 10);
};

const normalize = (record = {}) => {
  const startRaw = record.ngaybatdau ?? record.ngayBatDau ?? null;
  const endRaw = record.ngayketthuc ?? record.ngayKetThuc ?? null;

  const startDateOnly = toDateOnlyString(startRaw);
  const endDateOnly = toDateOnlyString(endRaw);

  const startDate = parseDate(startRaw);
  const endDate = parseDate(endRaw);
  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const soLuong = Number(record.soluong ?? record.soLuong ?? 0) || 0;
  const soLuongDaDung =
    Number(record.soluong_da_dung ?? record.soLuongDaDung ?? 0) || 0;
  const soLuongConLai = Math.max(0, soLuong - soLuongDaDung);

  let type =
    record.hinhthuc_giam ??
    record.hinhThucGiam ??
    record.hinhthucGiam ??
    "AMOUNT";
  type = String(type).toUpperCase();

  const isBirthdayOnly = !!(
    record.chi_ap_dung_sinhnhat ?? record.chiApDungSinhNhat
  );

  const isInRange =
    startDate && endDate
      ? todayOnly >=
          new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate()
          ) &&
        todayOnly <=
          new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate()
          )
      : false;

  const typeLabel =
    type === "PERCENT"
      ? "Giảm %"
      : type === "FREESHIP"
      ? "Freeship"
      : "Giảm tiền";

  return {
    // ID & code
    maVoucher: record.mavoucher ?? record.maVoucher ?? null,
    maCode: record.macode ?? record.maCode ?? "",
    maDonHang: record.madonhang ?? record.maDonHang ?? null,
    tenMaGiamGia:
      record.tenmagiamgia ?? record.tenMaGiamGia ?? record.ten_ma_giam_gia ?? "",

    // Mô tả & nhân viên
    moTa: record.mota ?? record.moTa ?? "",
    maNhanVien: record.manhanvien ?? record.maNhanVien ?? null,

    // Số lượng
    soLuong,
    soLuongDaDung,
    soLuongConLai,

    // Ngày
    ngayBatDau: startDateOnly,
    ngayKetThuc: endDateOnly,

    // Kiểu giảm & thông số
    hinhThucGiam: type, // AMOUNT | PERCENT | FREESHIP
    typeLabel,
    phanTramGiam:
      record.phantram_giam ?? record.phanTramGiam ?? record.phantramGiam ?? null,
    soTienGiam:
      record.sotien_giam ??
      record.soTienGiam ??
      record.giatrigiam ??
      record.giaTriGiam ??
      null,
    giamToiDa:
      record.giam_toi_da ?? record.giamToiDa ?? record.giamtoida ?? null,
    dieuKienDonToiThieu:
      record.dieukien_don_toi_thieu ??
      record.dieuKienDonToiThieu ??
      record.dieukienDonToiThieu ??
      null,

    // Sinh nhật
    chiApDungSinhNhat: isBirthdayOnly,
    isBirthdayOnly,

    // Optional: loại voucher nếu sau này xài
    maLoaiVoucher:
      record.maloaivoucher ?? record.maLoaiVoucher ?? record.ma_loai_voucher,

    // Trạng thái active (đang trong thời gian & còn lượt)
    isActive: isInRange && soLuongConLai > 0,
  };
};

const stripUndefined = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  );

const toDB = (voucher = {}) =>
  stripUndefined({
    macode: voucher.maCode ?? voucher.macode,
    mota: voucher.moTa ?? voucher.mota,
    tenmagiamgia: voucher.tenMaGiamGia ?? voucher.tenmagiamgia,

    maloaivoucher:
      voucher.maLoaiVoucher ?? voucher.maloaivoucher ?? undefined,

    hinhthuc_giam: voucher.hinhThucGiam ?? voucher.hinhthuc_giam,
    phantram_giam: voucher.phanTramGiam ?? voucher.phantram_giam,
    sotien_giam: voucher.soTienGiam ?? voucher.sotien_giam,
    giam_toi_da: voucher.giamToiDa ?? voucher.giam_toi_da,
    dieukien_don_toi_thieu:
      voucher.dieuKienDonToiThieu ?? voucher.dieukien_don_toi_thieu,

    chi_ap_dung_sinhnhat:
      voucher.chiApDungSinhNhat ?? voucher.chi_ap_dung_sinhnhat,

    soluong: voucher.soLuong ?? voucher.soluong,
    soluong_da_dung:
      voucher.soLuongDaDung ?? voucher.soluong_da_dung,

    ngaybatdau: voucher.ngayBatDau ?? voucher.ngaybatdau,
    ngayketthuc: voucher.ngayKetThuc ?? voucher.ngayketthuc,

    manhanvien: voucher.maNhanVien ?? voucher.manhanvien,
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
