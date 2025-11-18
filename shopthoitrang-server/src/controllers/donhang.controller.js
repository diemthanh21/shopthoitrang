const service = require('../services/donhang.service');

const DonHangController = {
  async getAll(req, res) {
    try {
      const data = await service.list(req.query);
      res.json(data.map(r => r.toJSON()));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await service.get(req.params.id);
      // item đã là JSON object nếu có items
      if (typeof item === 'object' && item.items) {
        res.json(item);
      } else {
        res.json(item.toJSON());
      }
    } catch (err) {
      res.status(err.status || 404).json({ message: err.message });
    }
  },

  async getByCustomer(req, res) {
    try {
      const data = await service.getByCustomer(req.params.makhachhang);
      // data có thể là array of JSON objects hoặc array of DonHang instances
      if (data.length > 0 && typeof data[0] === 'object' && data[0].items) {
        res.json(data);
      } else {
        res.json(data.map(r => r.toJSON()));
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
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
};

module.exports = DonHangController;
