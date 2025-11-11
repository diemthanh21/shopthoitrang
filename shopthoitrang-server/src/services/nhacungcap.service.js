const repo = require('../repositories/nhacungcap.repository');

class NhaCungCapService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy nhà cung cấp');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.tennhacungcap) {
      const e = new Error('Thiếu thông tin bắt buộc: tennhacungcap');
      e.status = 400;
      throw e;
    }

    const payload = {
      tennhacungcap: body.tennhacungcap,
      email: body.email ?? null
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy nhà cung cấp để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy nhà cung cấp để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá nhà cung cấp thành công' };
  }
}

module.exports = new NhaCungCapService();
