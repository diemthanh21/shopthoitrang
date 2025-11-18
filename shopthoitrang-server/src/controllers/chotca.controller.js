const service = require('../services/chotca.service');

const ChotCaController = {
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
      const item = await service.get(req.params.id);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 404).json({ message: err.message });
    }
  },

  async create(req, res) {
    try {
      const result = await service.create(req.body);
      return res.status(201).json(result.toJSON());
    } catch (error) {
      console.error('Error in create:', error);
      return res.status(error.status || 500).json({ message: error.message });
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

module.exports = ChotCaController;
