// controllers/nhanvien.controller.js
const nhanVienService = require('../services/nhanvien.service');

const NhanVienController = {
  async getAll(req, res) {
    try {
      const danhSach = await nhanVienService.getAll();
      res.json(danhSach);
    } catch (err) {
      res.status(500).json({ message: 'Lỗi khi lấy danh sách nhân viên.', error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const nv = await nhanVienService.getById(req.params.id);
      if (!nv) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
      res.json(nv);
    } catch (err) {
      res.status(500).json({ message: 'Lỗi khi lấy nhân viên.', error: err.message });
    }
  },

  async create(req, res) {
    try {
      await nhanVienService.create(req.body);
      res.status(201).json({ message: 'Đã thêm nhân viên.' });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi khi thêm nhân viên.', error: err.message });
    }
  },

  async update(req, res) {
    try {
      await nhanVienService.update(req.params.id, req.body);
      res.json({ message: 'Đã cập nhật nhân viên.' });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi khi cập nhật.', error: err.message });
    }
  },

  async delete(req, res) {
    try {
      await nhanVienService.delete(req.params.id);
      res.json({ message: 'Đã xóa nhân viên.' });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi khi xóa nhân viên.', error: err.message });
    }
  }
};

module.exports = NhanVienController;
