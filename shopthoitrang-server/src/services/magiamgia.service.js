// src/services/magiamgia.service.js
const repo = require('../repositories/magiamgia.repository');

class MaGiamGiaService {
  async list(filters) {
    return repo.getAll(filters);
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
