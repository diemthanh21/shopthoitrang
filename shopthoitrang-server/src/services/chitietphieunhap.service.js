const repo = require('../repositories/chitietphieunhap.repository');

class ChiTietPhieuNhapService {
  async getAll() {
    return await repo.getAll();
  }

  async getById(ma) {
    return await repo.getById(ma);
  }

  async findByPhieuNhap(maPN) {
    return await repo.findByPhieuNhap(maPN);
  }

  async findByChiTietSanPham(maCTSP) {
    return await repo.findByChiTietSanPham(maCTSP);
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

module.exports = new ChiTietPhieuNhapService();
