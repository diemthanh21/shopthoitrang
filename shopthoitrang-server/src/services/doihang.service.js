const repo = require('../repositories/doihang.repository');

class DoiHangService {
  async list() {
    return repo.getAll();
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy yêu cầu đổi hàng');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async getByCustomer(makhachhang) {
    return repo.getByCustomer(makhachhang);
  }

  async create(body) {
    const required = ['madonhang', 'makhachhang', 'machitietsanphamcu', 'machitietsanphamoi', 'soluong', 'lydo', 'trangthai'];
    for (const key of required) {
      if (!body[key]) {
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
      const e = new Error('Không tìm thấy yêu cầu để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy yêu cầu để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá yêu cầu đổi hàng thành công' };
  }
}

module.exports = new DoiHangService();
