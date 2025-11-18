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
      trangthai: body.trangthai ?? 'Đang kinh doanh',
      hinhanh: body.hinhanh ?? null,
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const fields = {};

    if (body.tensanpham !== undefined) fields.tensanpham = body.tensanpham;
    if (body.madanhmuc !== undefined) fields.madanhmuc = body.madanhmuc;
    if (body.mathuonghieu !== undefined) fields.mathuonghieu = body.mathuonghieu ?? null;
    if (body.trangthai !== undefined) fields.trangthai = body.trangthai;
    if (body.hinhanh !== undefined) fields.hinhanh = body.hinhanh ?? null;

    const updated = await repo.update(id, fields);
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
