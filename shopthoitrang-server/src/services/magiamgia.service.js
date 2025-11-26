// src/services/magiamgia.service.js
const repo = require('../repositories/magiamgia.repository');
const customerRepo = require('../repositories/taikhoankhachhang.repository');
const supabase = require('../../config/db');

const DATE_COLUMNS = ['ngay_su_dung', 'ngaysudung'];
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_MINUTE = 60 * 1000;

const toLocalDateTime = (inputDate = new Date()) => {
  const offsetMinutes = inputDate.getTimezoneOffset();
  return new Date(inputDate.getTime() - offsetMinutes * MS_PER_MINUTE);
};

const toLocalDateString = (date = new Date()) =>
  toLocalDateTime(date).toISOString().slice(0, 10);

const toNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeDateString = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return toLocalDateString(value);
  }
  const str = value.toString();
  if (DATE_ONLY_REGEX.test(str)) return str;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return null;
  return toLocalDateString(parsed);
};

const parseBirthMonth = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getMonth() + 1;
};

async function fetchUsageWithinYear(customerId, voucherIds, startIso, endIso) {
  if (!customerId || !Array.isArray(voucherIds) || !voucherIds.length) return [];
  const uniqueIds = [...new Set(voucherIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
  if (!uniqueIds.length) return [];

  let lastError = null;

  for (const column of DATE_COLUMNS) {
    const { data, error } = await supabase
      .from('magiamgia_sudung')
      .select(`mavoucher, ${column}`)
      .eq('makhachhang', customerId)
      .in('mavoucher', uniqueIds)
      .gte(column, startIso)
      .lt(column, endIso);

    if (!error) {
      return data || [];
    }

    lastError = error;

    if (error?.message && error.message.toLowerCase().includes(column.toLowerCase())) {
      continue;
    }

    throw error;
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}

async function buildCustomerBirthdayContext(customerId, vouchers, now = new Date()) {
  if (!customerId) {
    const localNow = toLocalDateTime(now);
    return { birthMonth: null, currentMonth: localNow.getMonth() + 1, usedBirthdayVoucherIds: new Set() };
  }

  const customer = await customerRepo.getById(customerId);
  const birthMonth =
    parseBirthMonth(customer?.ngaySinh || customer?.ngaysinh) ?? null;
  const localNow = toLocalDateTime(now);
  const currentMonth = localNow.getMonth() + 1;

  const birthdayVoucherIds = (vouchers || [])
    .filter((voucher) => voucher?.chiApDungSinhNhat)
    .map((voucher) => voucher.maVoucher)
    .filter((id) => Number.isInteger(id));

  let usedBirthdayVoucherIds = new Set();
  if (birthMonth && birthdayVoucherIds.length) {
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1).toISOString();
    const usageRows = await fetchUsageWithinYear(
      customerId,
      birthdayVoucherIds,
      startOfYear,
      startOfNextYear
    );
    usedBirthdayVoucherIds = new Set(
      (usageRows || []).map((row) => Number(row.mavoucher))
    );
  }

  return { birthMonth, currentMonth, usedBirthdayVoucherIds };
}

class MaGiamGiaService {
  async list(filters = {}, customerContext = {}) {
    const vouchers = await repo.getAll(filters);
    if (!Array.isArray(vouchers) || vouchers.length === 0) return [];

    if (!customerContext?.customerId) {
      return vouchers;
    }

    return this.filterVouchersForCustomer(vouchers, customerContext.customerId);
  }

  async filterVouchersForCustomer(vouchers, customerId) {
    if (!Array.isArray(vouchers) || !vouchers.length) return [];
    const now = new Date();
    const localNow = toLocalDateTime(now);
    const todayStr = toLocalDateString(localNow);
    const { birthMonth, currentMonth, usedBirthdayVoucherIds } = await buildCustomerBirthdayContext(
      customerId,
      vouchers,
      now
    );

    return vouchers.filter((voucher) => {
      const total = toNumber(voucher.soLuong, null);
      const used = toNumber(voucher.soLuongDaDung || voucher.soluong_da_dung || 0, 0);
      if (total !== null && used >= total) {
        return false;
      }

      if (voucher.ngayBatDau) {
        const start = normalizeDateString(voucher.ngayBatDau);
        if (start && todayStr < start) {
          return false;
        }
      }
      if (voucher.ngayKetThuc) {
        const end = normalizeDateString(voucher.ngayKetThuc);
        if (end && todayStr > end) {
          return false;
        }
      }

      if (voucher.chiApDungSinhNhat) {
        if (!birthMonth || birthMonth !== currentMonth) {
          return false;
        }
        if (usedBirthdayVoucherIds.has(voucher.maVoucher)) {
          return false;
        }
      }

      return true;
    });
  }

  async ensureCustomerVoucherEligibility(voucherIds = [], customerId) {
    if (!Array.isArray(voucherIds) || !voucherIds.length) return [];
    const normalizedIds = voucherIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);
    if (!normalizedIds.length) {
      const e = new Error('Danh sách voucher không hợp lệ');
      e.status = 400;
      throw e;
    }

    const vouchers = await repo.getByIds(normalizedIds);
    if (!vouchers.length) {
      const e = new Error('Không tìm thấy voucher để sử dụng');
      e.status = 400;
      throw e;
    }
    const foundIds = new Set(vouchers.map((v) => v.maVoucher));
    if (foundIds.size !== normalizedIds.length) {
      const missing = normalizedIds.filter((id) => !foundIds.has(id));
      const e = new Error(`Voucher không hợp lệ: ${missing.join(', ')}`);
      e.status = 400;
      throw e;
    }

      const now = new Date();
      const todayStr = toLocalDateString(now);
      const { birthMonth, currentMonth, usedBirthdayVoucherIds } = await buildCustomerBirthdayContext(
        customerId,
        vouchers,
        now
      );

    for (const voucher of vouchers) {
      const total = toNumber(voucher.soLuong, null);
      const used = toNumber(voucher.soLuongDaDung || voucher.soluong_da_dung || 0, 0);
      if (total !== null && used >= total) {
        const e = new Error(`Voucher ${voucher.maCode || voucher.mavoucher} đã hết lượt sử dụng`);
        e.status = 400;
        throw e;
      }

        if (voucher.ngayBatDau) {
          const start = normalizeDateString(voucher.ngayBatDau);
          if (start && todayStr < start) {
            const e = new Error(`Voucher ${voucher.maCode || voucher.mavoucher} chưa áp dụng`);
            e.status = 400;
            throw e;
          }
        }
        if (voucher.ngayKetThuc) {
          const end = normalizeDateString(voucher.ngayKetThuc);
          if (end && todayStr > end) {
            const e = new Error(`Voucher ${voucher.maCode || voucher.mavoucher} đã hết hạn`);
            e.status = 400;
            throw e;
          }
        }

      if (voucher.chiApDungSinhNhat) {
        if (!birthMonth) {
          const e = new Error('Vui lòng cập nhật ngày sinh để sử dụng voucher sinh nhật');
          e.status = 400;
          throw e;
        }
        if (birthMonth !== currentMonth) {
          const e = new Error('Voucher sinh nhật chỉ áp dụng trong tháng sinh nhật của bạn');
          e.status = 400;
          throw e;
        }
        if (usedBirthdayVoucherIds.has(voucher.maVoucher)) {
          const e = new Error('Bạn đã sử dụng voucher sinh nhật trong năm nay');
          e.status = 400;
          throw e;
        }
      }
    }

    return vouchers;
  }

  async incrementUsageCounts(vouchers = []) {
    if (!Array.isArray(vouchers) || !vouchers.length) return;
    const uniqueEntries = [];
    const seen = new Set();
    vouchers.forEach((voucher) => {
      const id = Number(voucher?.maVoucher ?? voucher?.mavoucher ?? voucher);
      if (!Number.isInteger(id) || id <= 0) return;
      if (seen.has(id)) return;
      uniqueEntries.push({ id, voucher });
      seen.add(id);
    });

    for (const entry of uniqueEntries) {
      const id = entry.id;
      const { data: existing, error: fetchErr } = await supabase
        .from('magiamgia')
        .select('soluong_da_dung')
        .eq('mavoucher', id)
        .maybeSingle();

      if (fetchErr) {
        console.error(`[MaGiamGiaService.incrementUsageCounts] Failed to read voucher ${id}:`, fetchErr);
        continue;
      }

      const currentUsed = toNumber(existing?.soluong_da_dung || 0, 0);
      const newUsed = currentUsed + 1;
      const { error } = await supabase
        .from('magiamgia')
        .update({ soluong_da_dung: newUsed })
        .eq('mavoucher', id);
      if (error) {
        console.error(`[MaGiamGiaService.incrementUsageCounts] Failed to update voucher ${id}:`, error);
      }
    }
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy mã giảm giá');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    // Các field bắt buộc ở mọi loại voucher
    const required = ['macode', 'tenmagiamgia', 'soluong', 'ngaybatdau', 'ngayketthuc', 'manhanvien'];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === '') {
        const e = new Error(`Thiếu thông tin bắt buộc: ${key}`);
        e.status = 400;
        throw e;
      }
    }

    // Validate ngày
    const start = new Date(body.ngaybatdau);
    const end = new Date(body.ngayketthuc);
    if (isNaN(start) || isNaN(end) || end < start) {
      const e = new Error('Khoảng thời gian không hợp lệ (ngayketthuc phải >= ngaybatdau)');
      e.status = 400;
      throw e;
    }

    // Validate số lượng
    if (Number(body.soluong) < 0) {
      const e = new Error('Số lượng không hợp lệ');
      e.status = 400;
      throw e;
    }

    // Helper parse number
    const toNumberOrNull = (v) => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // Kiểu giảm giá
    let type = (body.hinhthuc_giam || 'AMOUNT').toUpperCase();
    if (!['AMOUNT', 'PERCENT', 'FREESHIP'].includes(type)) {
      const e = new Error('hinhthuc_giam không hợp lệ (AMOUNT | PERCENT | FREESHIP)');
      e.status = 400;
      throw e;
    }
    body.hinhthuc_giam = type;

    // Nếu có dùng bảng loaivoucher thì maloaivoucher là FK, còn không có thì FE đừng gửi lên
    if (body.maloaivoucher !== undefined && body.maloaivoucher !== null) {
      const mv = Number(body.maloaivoucher);
      if (!Number.isInteger(mv) || mv <= 0) {
        const e = new Error('maloaivoucher không hợp lệ');
        e.status = 400;
        throw e;
      }
    }

    // Validate theo từng loại
    if (type === 'PERCENT') {
      const percent = toNumberOrNull(body.phantram_giam);
      if (percent === null || percent <= 0 || percent > 100) {
        const e = new Error('phantram_giam phải trong khoảng (0, 100]');
        e.status = 400;
        throw e;
      }
      body.phantram_giam = percent;

      const max = toNumberOrNull(body.giam_toi_da);
      if (max !== null && max < 0) {
        const e = new Error('giam_toi_da không hợp lệ');
        e.status = 400;
        throw e;
      }
      body.giam_toi_da = max;

      // Clear các field không dùng
      body.sotien_giam = null;
      body.giatrigiam = null;
    } else if (type === 'FREESHIP') {
      const maxShip = toNumberOrNull(body.giam_toi_da);
      if (maxShip === null || maxShip <= 0) {
        const e = new Error('giam_toi_da (giá trị freeship tối đa) phải > 0');
        e.status = 400;
        throw e;
      }
      body.giam_toi_da = maxShip;

      body.phantram_giam = null;
      body.sotien_giam = null;
      body.giatrigiam = null;
    } else {
      // AMOUNT (giảm tiền cố định)
      let amount = toNumberOrNull(body.sotien_giam);
      if (amount === null) {
        // Hỗ trợ FE cũ gửi giatrigiam
        amount = toNumberOrNull(body.giatrigiam);
      }
      if (amount === null || amount <= 0) {
        const e = new Error('Giá trị giảm phải lớn hơn 0');
        e.status = 400;
        throw e;
      }
      body.sotien_giam = amount;
      // Đồng bộ với cột cũ nếu còn giữ lại
      body.giatrigiam = amount;

      body.phantram_giam = null;
      // giam_toi_da có thể null
    }

    // Điều kiện đơn tối thiểu (nếu có)
    if (body.dieukien_don_toi_thieu !== undefined && body.dieukien_don_toi_thieu !== null) {
      const minOrder = toNumberOrNull(body.dieukien_don_toi_thieu);
      if (minOrder === null || minOrder < 0) {
        const e = new Error('dieukien_don_toi_thieu không hợp lệ');
        e.status = 400;
        throw e;
      }
      body.dieukien_don_toi_thieu = minOrder;
    }

    // chi_ap_dung_sinhnhat: ép về boolean nếu FE gửi "true"/"false"
    if (body.chi_ap_dung_sinhnhat !== undefined) {
      body.chi_ap_dung_sinhnhat =
        body.chi_ap_dung_sinhnhat === true || body.chi_ap_dung_sinhnhat === 'true';
    }

    // soluong_da_dung để DB default 0

    return repo.create(body);
  }

  async update(id, body) {
    // Ở đây cho phép update linh hoạt, FE gửi gì sửa cái đó.
    // Nếu muốn ràng buộc chặt giống create thì có thể:
    // 1. load voucher cũ
    // 2. merge lại rồi dùng lại logic validate ở trên.
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy mã giảm giá để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy mã giảm giá để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá mã giảm giá thành công' };
  }
}

module.exports = new MaGiamGiaService();
