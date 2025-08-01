// services/nhanvien.service.js
const NhanVienRepository = require('../repositories/nhanvien.repository');
const NhanVien = require('../models/nhanvien.model');

class NhanVienService {
  async getAll() {
    const data = await NhanVienRepository.findAll();
    return data.map(row => new NhanVien(row));
  }

  async getById(id) {
    const data = await NhanVienRepository.findById(id);
    if (!data) return null;
    return new NhanVien(data);
  }

  async create(nv) {
    await NhanVienRepository.create(nv);
  }

  async update(id, nv) {
    await NhanVienRepository.update(id, nv);
  }

  async delete(id) {
    await NhanVienRepository.remove(id);
  }
}

module.exports = new NhanVienService();
