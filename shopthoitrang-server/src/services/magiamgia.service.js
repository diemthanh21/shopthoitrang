const repo = require('../repositories/magiamgia.repository');

class MaGiamGiaService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy mã giảm giá');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    const required = ['macode', 'giatrigiam', 'soluong', 'ngaybatdau', 'ngayketthuc', 'manhanvien'];
    for (const key of required) {
      if (!body[key] && body[key] !== 0) {
        const e = new Error(`Thiếu thông tin bắt buộc: ${key}`);
        e.status = 400;
        throw e;
      }
    }

    // Validate ngày
    const start = new Date(body.ngaybatdau);
    const end = new Date(body.ngayketthuc);
    if (isNaN(start) || isNaN(end) || end < start) {
      const e = new Error('Khoảng thời gian không hợp lệ (ngayketthuc >= ngaybatdau)');
      e.status = 400;
      throw e;
    }

    // Validate giảm giá
    if (Number(body.giatrigiam) <= 0) {
      const e = new Error('Giá trị giảm phải lớn hơn 0');
      e.status = 400;
      throw e;
    }

    // Validate số lượng
    if (Number(body.soluong) < 0) {
      const e = new Error('Số lượng không hợp lệ');
      e.status = 400;
      throw e;
    }

    return repo.create(body);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy mã giảm giá để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy mã giảm giá để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá mã giảm giá thành công' };
  }
}

module.exports = new MaGiamGiaService();
