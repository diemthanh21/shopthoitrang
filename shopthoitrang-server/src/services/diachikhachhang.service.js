const repo = require('../repositories/diachikhachhang.repository');

class DiaChiKhachHangService {
  async list() {
    return repo.getAll();
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy địa chỉ');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async getByCustomer(makhachhang) {
    return repo.getByCustomerId(makhachhang);
  }

  async create(body) {
    if (!body.makhachhang || !body.diachi) {
      const e = new Error('Thiếu thông tin bắt buộc: makhachhang, diachi');
      e.status = 400;
      throw e;
    }
    return repo.create(body);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy địa chỉ để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy địa chỉ để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá địa chỉ thành công' };
  }
}

module.exports = new DiaChiKhachHangService();
