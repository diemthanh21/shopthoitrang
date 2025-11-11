const repo = require('../repositories/khuyenmai.repository');

class KhuyenMaiService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy khuyến mãi');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    const required = ['tenchuongtrinh', 'loaikhuyenmai', 'ngaybatdau', 'ngayketthuc', 'manhanvien'];
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === '') {
        const e = new Error(`Thiếu thông tin bắt buộc: ${k}`);
        e.status = 400;
        throw e;
      }
    }

    // Validate ngày
    const bd = new Date(body.ngaybatdau);
    const kt = new Date(body.ngayketthuc);
    if (isNaN(bd) || isNaN(kt) || kt < bd) {
      const e = new Error('Khoảng ngày không hợp lệ (ngayketthuc phải >= ngaybatdau)');
      e.status = 400;
      throw e;
    }

    // Validate tỷ lệ giảm (nếu có)
    if (body.tylegiam !== undefined && body.tylegiam !== null) {
      const v = Number(body.tylegiam);
      if (!(v >= 0 && v <= 100)) {
        const e = new Error('tylegiam phải trong (0, 100]');
        e.status = 400;
        throw e;
      }
    }

    return repo.create(body);
  }

  async update(id, body) {
    if (body.ngaybatdau || body.ngayketthuc) {
      const bd = body.ngaybatdau ? new Date(body.ngaybatdau) : null;
      const kt = body.ngayketthuc ? new Date(body.ngayketthuc) : null;
      if ((bd && isNaN(bd)) || (kt && isNaN(kt))) {
        const e = new Error('Ngày không hợp lệ');
        e.status = 400;
        throw e;
      }
      if (bd && kt && kt < bd) {
        const e = new Error('ngayketthuc phải >= ngaybatdau');
        e.status = 400;
        throw e;
      }
    }

    if (body.tylegiam !== undefined && body.tylegiam !== null) {
      const v = Number(body.tylegiam);
      if (!(v > 0 && v <= 100)) {
        const e = new Error('tylegiam phải trong (0, 100]');
        e.status = 400;
        throw e;
      }
    }

    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy khuyến mãi để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy khuyến mãi để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá khuyến mãi thành công' };
  }
}

module.exports = new KhuyenMaiService();
