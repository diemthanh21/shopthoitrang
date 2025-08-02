const repo = require('../repositories/chitietdonhang.repository');

class ChiTietDonHangService {
  async getAll() {
    return await repo.getAll();
  }

  async getById(id) {
    return await repo.getById(id);
  }

  async findByDonHang(maDonHang) {
    return await repo.findByDonHang(maDonHang);
  }

  async findByChiTietSanPham(maCTSP) {
    return await repo.findByChiTietSanPham(maCTSP);
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

module.exports = new ChiTietDonHangService();
