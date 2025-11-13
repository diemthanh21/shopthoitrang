const service = require('../services/chitietsanpham.service');

const ChiTietSanPhamController = {
  async getAll(req, res, next) {
    try {
      const { masanpham, search, minPrice, maxPrice, limit, offset, orderBy, orderDir } = req.query;
      const { items, total } = await service.list({
        masanpham,
        search,
        minPrice,
        maxPrice,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
        orderBy,
        orderDir,
      });
      res.json({ items: items.map((i) => i.toJSON()), total });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res) {
    try {
      const item = await service.get(req.params.id);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 404).json({ message: err.message || 'Khong tim thay' });
    }
  },

  async create(req, res) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Tao that bai' });
    }
  },

  async update(req, res) {
    try {
      const item = await service.update(req.params.id, req.body);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Cap nhat that bai' });
    }
  },

  async delete(req, res) {
    try {
      const result = await service.remove(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Xoa that bai' });
    }
  },

  async getSizes(req, res) {
    try {
      const data = await service.getSizes(req.params.id);
      res.json(data);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Khong tim thay size' });
    }
  },

  async saveSizes(req, res) {
    try {
      const data = await service.replaceSizes(req.params.id, req.body);
      res.json(data);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message || 'Cap nhat size that bai' });
    }
  },
};

module.exports = ChiTietSanPhamController;
