const repo = require('../repositories/sanpham.repository');

class SanPhamService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy sản phẩm');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    const required = ['tensanpham', 'madanhmuc'];
    for (const f of required) {
      if (!body[f]) {
        const e = new Error(`Thiếu thông tin bắt buộc: ${f}`);
        e.status = 400;
        throw e;
      }
    }

    const payload = {
      tensanpham: body.tensanpham,
      madanhmuc: body.madanhmuc,
      mathuonghieu: body.mathuonghieu ?? null,
      trangthai: body.trangthai ?? 'Đang kinh doanh'
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy sản phẩm để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy sản phẩm để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá sản phẩm thành công' };
  }
}

module.exports = new SanPhamService();
