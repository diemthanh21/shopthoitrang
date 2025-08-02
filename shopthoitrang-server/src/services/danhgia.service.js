const repo = require('../repositories/danhgia.repository');

class DanhGiaService {
  async getAll() {
    return await repo.getAll();
  }

  async getById(id) {
    return await repo.getById(id);
  }

  async findBySanPham(maSP) {
    return await repo.findBySanPham(maSP);
  }

  async findByKhachHang(maKH) {
    return await repo.findByKhachHang(maKH);
  }

  async findByChiTietDonHang(maCTDH) {
    return await repo.findByChiTietDonHang(maCTDH);
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

module.exports = new DanhGiaService();
