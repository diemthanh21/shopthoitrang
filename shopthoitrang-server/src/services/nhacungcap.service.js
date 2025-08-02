const repo = require('../repositories/nhacungcap.repository');

class NhaCungCapService {
  async getAll() {
    return await repo.getAll();
  }

  async getById(ma) {
    return await repo.getById(ma);
  }

  async findByName(name) {
    return await repo.findByName(name);
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

module.exports = new NhaCungCapService();
