const repo = require('../repositories/calamviec.repository');

const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/; // HH:MM hoặc HH:MM:SS

function ensureTimeFormat(value, fieldName) {
  if (value === undefined) return;
  if (!value || !TIME_RE.test(value)) {
    const e = new Error(`${fieldName} phải có dạng HH:MM hoặc HH:MM:SS`);
    e.status = 400; throw e;
  }
}

function isStartBeforeEnd(start, end) {
  // so sánh chuỗi HH:MM(:SS) an toàn vì fixed width
  return start < end;
}

class CaLamViecService {
  async list(params) {
    return repo.getAll(params || {});
  }

  async get(id) {
    const item = await repo.getById(Number(id));
    if (!item) {
      const e = new Error('Không tìm thấy ca làm việc');
      e.status = 404; throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.tenca || !body.tenca.trim()) {
      const e = new Error('tenca là bắt buộc');
      e.status = 400; throw e;
    }
    if (body.tenca.length > 50) {
      const e = new Error('tenca tối đa 50 ký tự');
      e.status = 400; throw e;
    }

    ensureTimeFormat(body.giobatdau, 'giobatdau');
    ensureTimeFormat(body.gioketthuc, 'gioketthuc');

    if (!body.giobatdau || !body.gioketthuc) {
      const e = new Error('giobatdau và gioketthuc là bắt buộc');
      e.status = 400; throw e;
    }

    const payload = {
      tenca: body.tenca.trim(),
      giobatdau: body.giobatdau,
      gioketthuc: body.gioketthuc,
      mota: body.mota?.trim() ?? null,
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const fields = {};

    if (body.tenca !== undefined) {
      if (!body.tenca || !body.tenca.trim()) {
        const e = new Error('tenca không được rỗng');
        e.status = 400; throw e;
      }
      if (body.tenca.length > 50) {
        const e = new Error('tenca tối đa 50 ký tự');
        e.status = 400; throw e;
      }
      fields.tenca = body.tenca.trim();
    }

    if (body.giobatdau !== undefined) {
      ensureTimeFormat(body.giobatdau, 'giobatdau');
      fields.giobatdau = body.giobatdau;
    }

    if (body.gioketthuc !== undefined) {
      ensureTimeFormat(body.gioketthuc, 'gioketthuc');
      fields.gioketthuc = body.gioketthuc;
    }

    if (fields.giobatdau !== undefined || fields.gioketthuc !== undefined) {
      // Lấy item hiện có để kiểm tra điều kiện start < end
      const current = await repo.getById(Number(id));
      const start = fields.giobatdau ?? current?.giobatdau;
      const end   = fields.gioketthuc ?? current?.gioketthuc;
      if (!start || !end) {
        const e = new Error('giobatdau và gioketthuc là bắt buộc');
        e.status = 400; throw e;
      }
    
    }

    if (body.mota !== undefined) {
      fields.mota = body.mota?.trim() ?? null;
    }

    const updated = await repo.update(Number(id), fields);
    if (!updated) {
      const e = new Error('Không tìm thấy ca làm việc để cập nhật');
      e.status = 404; throw e;
    }
    return updated;
  }

  async remove(id) {
    const ok = await repo.remove(Number(id));
    if (!ok) {
      const e = new Error('Không tìm thấy ca làm việc để xoá');
      e.status = 404; throw e;
    }
    return { message: 'Đã xoá ca làm việc thành công' };
  }
}

module.exports = new CaLamViecService();
