const repo = require('../repositories/donhang.repository');

class DonHangService {
  async getAll() {
    return await repo.getAll();
  }

  async getById(id) {
    return await repo.getById(id);
  }

  async findByKhachHang(maKH) {
    return await repo.findByKhachHang(maKH);
  }

  async create(data) {
    return await repo.create(data);
  }

  async update(id, data) {
    return await repo.update(id, data);
  }

  async delete(id) {
    return await repo.delete(id);
  }
}

module.exports = new DonHangService();