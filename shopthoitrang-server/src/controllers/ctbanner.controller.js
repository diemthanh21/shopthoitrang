const service = require('../services/ctbanner.service');

const CTBannerController = {
  async getAll(req, res) {
    try {
      const data = await service.list(req.query);
      res.json(data.map((r) => r.toJSON()));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const { mabanner, manhanvien } = req.params;
      const item = await service.get(mabanner, manhanvien);
      res.json(item.toJSON());
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
      const { mabanner, manhanvien } = req.params;
      const item = await service.update(mabanner, manhanvien, req.body);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const { mabanner, manhanvien } = req.params;
      const result = await service.delete(mabanner, manhanvien);
      res.json(result);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },
};

module.exports = CTBannerController;
