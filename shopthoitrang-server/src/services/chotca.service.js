const repo = require('../repositories/chotca.repository');

class ChotCaService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy chốt ca');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.maphancong || !body.manhanvien || !body.maca) {
      const e = new Error('Thiếu thông tin bắt buộc: maphancong, manhanvien, maca');
      e.status = 400;
      throw e;
    }
    return repo.create(body);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy chốt ca để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy chốt ca để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá chốt ca thành công' };
  }
}

module.exports = new ChotCaService();
