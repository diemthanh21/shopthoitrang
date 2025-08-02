const repo = require('../repositories/ctbanner.repository');

class CTBannerService {
  async getAll() {
    return await repo.getAll();
  }

  async getByMaBanner(maBanner) {
    return await repo.getByMaBanner(maBanner);
  }

  async create(data) {
    return await repo.create(data);
  }

  async delete(maBanner, maNhanVien) {
    return await repo.delete(maBanner, maNhanVien);
  }
}

module.exports = new CTBannerService();
