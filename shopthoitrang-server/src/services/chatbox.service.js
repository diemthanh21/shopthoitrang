const repo = require('../repositories/chatbox.repository');

class ChatBoxService {
  async getAll() {
    return await repo.getAll();
  }

  async getById(ma) {
    return await repo.getById(ma);
  }

  async findByKhachHang(maKH) {
    return await repo.findByKhachHang(maKH);
  }

  async findByNhanVien(maNV) {
    return await repo.findByNhanVien(maNV);
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

module.exports = new ChatBoxService();
