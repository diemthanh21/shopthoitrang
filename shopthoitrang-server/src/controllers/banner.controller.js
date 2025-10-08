const service = require('../services/banner.service');

const BannerController = {
  async getAll(req, res, next) {
    try {
      const { search, active, limit, offset, orderBy, orderDir } = req.query;
      const { items, total } = await service.list({
        search,
        active,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
        orderBy,
        orderDir,
      });
      res.json({ items: items.map((b) => b.toJSON()), total });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res) {
    try {
      const item = await service.get(req.params.id);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 404).json({ message: err.message || 'Không tìm thấy' });
    }
  },

  async create(req, res) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Tạo thất bại' });
    }
  },

  async update(req, res) {
    try {
      const item = await service.update(req.params.id, req.body);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Cập nhật thất bại' });
    }
  },

  async delete(req, res) {
    try {
      const result = await service.remove(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Xoá thất bại' });
    }
  },
};

module.exports = BannerController;
