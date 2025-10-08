const repo = require('../repositories/thethanhvien.repository');

class TheThanhVienService {
  async list() {
    return repo.getAll();
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy thẻ thành viên');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.makhachhang || !body.mahangthe) {
      const e = new Error('Thiếu thông tin bắt buộc: makhachhang, mahangthe');
      e.status = 400;
      throw e;
    }

    const payload = {
      makhachhang: body.makhachhang,
      mahangthe: body.mahangthe,
      ngaycap: body.ngaycap ?? new Date().toISOString(),
      ngayhethan: body.ngayhethan ?? null,
      trangthai: body.trangthai ?? true
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy thẻ thành viên để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy thẻ thành viên để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá thẻ thành viên thành công' };
  }
}

module.exports = new TheThanhVienService();
