const repo = require('../repositories/ctbanner.repository');

class CTBannerService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(mabanner, manhanvien) {
    const item = await repo.getById(mabanner, manhanvien);
    if (!item) {
      const e = new Error('Không tìm thấy chi tiết banner');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.mabanner || !body.manhanvien) {
      const e = new Error('Thiếu thông tin bắt buộc: mabanner, manhanvien');
      e.status = 400;
      throw e;
    }
    body.thoigiandoi = body.thoigiandoi || new Date().toISOString();
    return repo.create(body);
  }

  async update(mabanner, manhanvien, body) {
    const updated = await repo.update(mabanner, manhanvien, body);
    if (!updated) {
      const e = new Error('Không tìm thấy bản ghi để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(mabanner, manhanvien) {
    const deleted = await repo.remove(mabanner, manhanvien);
    if (!deleted) {
      const e = new Error('Không tìm thấy bản ghi để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá chi tiết banner thành công' };
  }
}

module.exports = new CTBannerService();
