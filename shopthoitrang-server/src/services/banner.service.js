const repo = require('../repositories/banner.repository');

function isValidUrl(url) {
  try { new URL(url); return true; } catch { return false; }
}

class BannerService {
  async list(params) {
    // ép kiểu boolean cho active nếu client gửi "true"/"false"
    const normalized = { ...params };
    if (typeof normalized.active === 'string') {
      normalized.active = normalized.active.toLowerCase() === 'true';
    }
    return repo.getAll(normalized);
  }

  async get(id) {
    const item = await repo.getById(Number(id));
    if (!item) {
      const e = new Error('Không tìm thấy banner');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    // Validate
    if (!body.duongdananh || !body.duongdananh.trim()) {
      const e = new Error('duongdananh là bắt buộc');
      e.status = 400; throw e;
    }
    if (body.lienket && body.lienket.trim() && !isValidUrl(body.lienket)) {
      const e = new Error('lienket không hợp lệ (URL)');
      e.status = 400; throw e;
    }
    if (body.thutuhienthi !== undefined && Number.isNaN(Number(body.thutuhienthi))) {
      const e = new Error('thutuhienthi phải là số');
      e.status = 400; throw e;
    }

    const payload = {
      duongdananh: body.duongdananh.trim(),
      mota: body.mota?.trim() ?? null,
      lienket: body.lienket?.trim() ?? null,
      thutuhienthi: body.thutuhienthi !== undefined ? Number(body.thutuhienthi) : null,
      danghoatdong: typeof body.danghoatdong === 'boolean' ? body.danghoatdong : true,
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const fields = {};
    if (body.duongdananh !== undefined) {
      if (!body.duongdananh || !body.duongdananh.trim()) {
        const e = new Error('duongdananh không được rỗng');
        e.status = 400; throw e;
      }
      fields.duongdananh = body.duongdananh.trim();
    }
    if (body.mota !== undefined) fields.mota = body.mota?.trim() ?? null;

    if (body.lienket !== undefined) {
      if (body.lienket && body.lienket.trim() && !isValidUrl(body.lienket)) {
        const e = new Error('lienket không hợp lệ (URL)');
        e.status = 400; throw e;
      }
      fields.lienket = body.lienket?.trim() ?? null;
    }

    if (body.thutuhienthi !== undefined) {
      if (Number.isNaN(Number(body.thutuhienthi))) {
        const e = new Error('thutuhienthi phải là số');
        e.status = 400; throw e;
      }
      fields.thutuhienthi = Number(body.thutuhienthi);
    }

    if (body.danghoatdong !== undefined) {
      fields.danghoatdong = !!body.danghoatdong;
    }

    const updated = await repo.update(Number(id), fields);
    if (!updated) {
      const e = new Error('Không tìm thấy banner để cập nhật');
      e.status = 404; throw e;
    }
    return updated;
  }

  async remove(id) {
    const ok = await repo.remove(Number(id));
    if (!ok) {
      const e = new Error('Không tìm thấy banner để xoá');
      e.status = 404; throw e;
    }
    return { message: 'Đã xoá banner thành công' };
  }
}

module.exports = new BannerService();
