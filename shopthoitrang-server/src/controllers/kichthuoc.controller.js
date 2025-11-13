const service = require('../services/kichthuoc.service');

const KichThuocController = {
  async getAll(req, res) {
    try {
      const data = await service.list();
      res.json(data.map((item) => item.toJSON()));
    } catch (err) {
      res.status(500).json({ message: err.message || 'Khong the tai kich thuoc' });
    }
  },

  async create(req, res) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Tao kich thuoc that bai' });
    }
  },

  async update(req, res) {
    try {
      const item = await service.update(req.params.id, req.body);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Cap nhat kich thuoc that bai' });
    }
  },

  async remove(req, res) {
    try {
      const result = await service.remove(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Xoa kich thuoc that bai' });
    }
  },
};

module.exports = KichThuocController;
