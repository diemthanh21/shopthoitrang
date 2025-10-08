const repo = require('../repositories/thuonghieu.repository');

class ThuongHieuService {
  async list() {
    return repo.getAll();
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy thương hiệu');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.tenthuonghieu) {
      const e = new Error('Thiếu thông tin bắt buộc: tenthuonghieu');
      e.status = 400;
      throw e;
    }

    const payload = {
      tenthuonghieu: body.tenthuonghieu
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy thương hiệu để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy thương hiệu để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá thương hiệu thành công' };
  }
}

module.exports = new ThuongHieuService();
