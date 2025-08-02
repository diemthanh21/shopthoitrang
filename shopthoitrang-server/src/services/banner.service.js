const repo = require('../repositories/banner.repository');

class BannerService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(id) {
    return await repo.getById(id);
  }

  async taoMoi(data) {
    return await repo.create(data);
  }

  async capNhat(id, data) {
    return await repo.update(id, data);
  }

  async xoa(id) {
    return await repo.delete(id);
  }

  async timTheoTrangThai(status) {
    return await repo.searchByStatus(status);
  }
}

module.exports = new BannerService();