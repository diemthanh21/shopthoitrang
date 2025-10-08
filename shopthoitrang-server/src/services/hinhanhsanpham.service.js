const repo = require('../repositories/hinhanhsanpham.repository');

class HinhAnhSanPhamService {
  async list() {
    return repo.getAll();
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy hình ảnh sản phẩm');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async getByProductDetail(machitietsanpham) {
    return repo.getByProductDetail(machitietsanpham);
  }

  async create(body) {
    if (!body.machitietsanpham || !body.duongdanhinhanh) {
      const e = new Error('Thiếu thông tin bắt buộc: machitietsanpham, duongdanhinhanh');
      e.status = 400;
      throw e;
    }
    return repo.create(body);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy hình ảnh để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy hình ảnh để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá hình ảnh thành công' };
  }
}

module.exports = new HinhAnhSanPhamService();
