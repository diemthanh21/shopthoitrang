const repo = require('../repositories/chucnang.repository');

class ChucNangService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    const item = await repo.getById(ma);
    if (!item) {
      const error = new Error('Không tìm thấy chức năng');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async taoMoi(data) {
    if (!data.tenchucnang || !data.tenchucnang.trim()) {
      const error = new Error('Tên chức năng không được để trống');
      error.status = 400;
      throw error;
    }
    return await repo.create({ tenchucnang: data.tenchucnang.trim() });
  }

  async capNhat(ma, data) {
    const item = await repo.update(ma, data);
    if (!item) {
      const error = new Error('Không tìm thấy chức năng để cập nhật');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async xoa(ma) {
    const deleted = await repo.delete(ma);
    if (!deleted) {
      const error = new Error('Không tìm thấy chức năng để xoá');
      error.status = 404;
      throw error;
    }
    return { message: 'Đã xoá chức năng thành công' };
  }
}

module.exports = new ChucNangService();
