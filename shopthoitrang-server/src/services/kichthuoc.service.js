const repo = require('../repositories/kichthuoc.repository');

class KichThuocService {
  async list() {
    return repo.getAll();
  }

  async create(body) {
    if (!body.ten_kichthuoc && !body.tenKichThuoc) {
      const e = new Error('ten_kichthuoc is required');
      e.status = 400;
      throw e;
    }
    const payload = {
      ten_kichthuoc: (body.ten_kichthuoc ?? body.tenKichThuoc ?? '').trim(),
      mo_ta: body.mo_ta ?? body.moTa ?? null,
    };
    if (!payload.ten_kichthuoc) {
      const e = new Error('ten_kichthuoc is required');
      e.status = 400;
      throw e;
    }
    return repo.create(payload);
  }

  async update(id, body) {
    const fields = {};
    if (body.ten_kichthuoc !== undefined || body.tenKichThuoc !== undefined) {
      const value = (body.ten_kichthuoc ?? body.tenKichThuoc ?? '').trim();
      if (!value) {
        const e = new Error('ten_kichthuoc cannot be empty');
        e.status = 400;
        throw e;
      }
      fields.ten_kichthuoc = value;
    }
    if (body.mo_ta !== undefined || body.moTa !== undefined) {
      fields.mo_ta = body.mo_ta ?? body.moTa ?? null;
    }

    const updated = await repo.update(id, fields);
    if (!updated) {
      const e = new Error('Size not found');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async remove(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Size not found');
      e.status = 404;
      throw e;
    }
    return { message: 'Deleted size successfully' };
  }
}

module.exports = new KichThuocService();
