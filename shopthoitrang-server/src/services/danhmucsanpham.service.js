const repo = require('../repositories/danhmucsanpham.repository');

class DanhMucSanPhamService {
  async list() {
    return repo.getAll();
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy danh mục sản phẩm');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.tendanhmuc) {
      const e = new Error('Thiếu tên danh mục sản phẩm');
      e.status = 400;
      throw e;
    }
    return repo.create(body);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy danh mục để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy danh mục để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá danh mục sản phẩm thành công' };
  }
}

module.exports = new DanhMucSanPhamService();
