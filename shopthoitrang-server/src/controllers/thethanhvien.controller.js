const service = require('../services/thethanhvien.service');

const TheThanhVienController = {
  async getAll(req, res) {
    try {
      const data = await service.list();
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  },

  async getByKhachHang(req, res) {
    try {
      const data = await service.getByKhachHang(req.params.makhachhang);
      res.json(data);
    } catch (err) {
      res.status(err.status || 404).json({ message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await service.get(req.params.id);
      res.json(item);
    } catch (err) {
      res.status(err.status || 404).json({ message: err.message });
    }
  },

  async create(req, res) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  async update(req, res) {
    try {
      const item = await service.update(req.params.id, req.body);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const result = await service.delete(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  async syncAll(req, res) {
    try {
      const result = await service.syncAll();
      res.json({
        message: 'Đã đồng bộ thẻ thành viên cho toàn bộ khách hàng',
        ...result,
      });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  },
};

module.exports = TheThanhVienController;
