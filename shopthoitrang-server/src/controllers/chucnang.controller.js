const service = require('../services/chucnang.service');

const ChucNangController = {
  async getAll(req, res, next) {
    try {
      const list = await service.layTatCa();
      res.json(list.map(e => e.toJSON()));
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const ma = Number(req.params.id);
      const item = await service.layTheoMa(ma);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 404).json({ message: err.message || 'Không tìm thấy' });
    }
  },

  async create(req, res, next) {
    try {
      const item = await service.taoMoi(req.body);
      res.status(201).json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Tạo thất bại' });
    }
  },

  async update(req, res, next) {
    try {
      const ma = Number(req.params.id);
      const item = await service.capNhat(ma, req.body);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Cập nhật thất bại' });
    }
  },

  async delete(req, res, next) {
    try {
      const ma = Number(req.params.id);
      const result = await service.xoa(ma);
      res.json(result);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Xoá thất bại' });
    }
  }
};

module.exports = ChucNangController;
