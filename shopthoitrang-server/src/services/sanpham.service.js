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
    for (const field of required) {
      if (!body[field]) {
        const e = new Error(`Thi���u thA'ng tin b��_t bu��Tc: ${field}`);
        e.status = 400;
        throw e;
      }
    }

    const payload = {
      tensanpham: body.tensanpham,
      madanhmuc: body.madanhmuc,
      mathuonghieu: body.mathuonghieu ?? null,
      trangthai: body.trangthai ?? '�?ang kinh doanh',
      hinhanh: body.hinhanh ?? null,
      bangsize: body.bangsize ?? null,
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
    if (body.bangsize !== undefined) fields.bangsize = body.bangsize ?? null;

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
      const e = new Error('Không tìm thấy sản phẩm để xóa');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xóa sản phẩm thành công' };
  }

  async stats(id) {
    return repo.getStats(Number(id));
  }

  async count() {
    return repo.count();
  }
}

module.exports = new SanPhamService();
