const repo = require('../repositories/danhmucsanpham.repository');

class DanhMucSanPhamService {
  async getAll() {
    return await repo.getAll();
  }

  async getById(ma) {
    return await repo.getById(ma);
  }

  async create(data) {
    return await repo.create(data);
  }

  async update(ma, data) {
    return await repo.update(ma, data);
  }

  async delete(ma) {
    return await repo.delete(ma);
  }
}

module.exports = new DanhMucSanPhamService();
