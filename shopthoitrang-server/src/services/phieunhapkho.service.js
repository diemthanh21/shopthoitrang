const repo = require('../repositories/phieunhapkho.repository');

class PhieuNhapKhoService {
  async getAll() {
    return await repo.getAll();
  }

  async getById(ma) {
    return await repo.getById(ma);
  }

  async findByNhanVien(maNV) {
    return await repo.findByNhanVien(maNV);
  }

  async findByNhaCungCap(maNCC) {
    return await repo.findByNhaCungCap(maNCC);
  }

  async findByNgayNhap(date) {
    return await repo.findByNgayNhap(date);
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

module.exports = new PhieuNhapKhoService();
