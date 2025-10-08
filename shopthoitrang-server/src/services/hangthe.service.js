const repo = require('../repositories/hangthe.repository');

class HangTheService {
  async list() {
    return repo.getAll();
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy hạng thẻ');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    const required = ['tenhang', 'giamgia', 'voucher_sinhnhat'];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null) {
        const e = new Error(`Thiếu thông tin bắt buộc: ${key}`);
        e.status = 400;
        throw e;
      }
    }
    return repo.create(body);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy hạng thẻ để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy hạng thẻ để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá hạng thẻ thành công' };
  }
}

module.exports = new HangTheService();
