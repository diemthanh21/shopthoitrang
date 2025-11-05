const service = require('../services/catalog.service');

const CatalogController = {
  async listProducts(req, res) {
    try {
      const q = {
        categoryName: req.query.categoryName,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        onlyFiveStar: req.query.onlyFiveStar === 'true',
        limit: req.query.limit ? Number(req.query.limit) : 20,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      };
      const items = await service.listProducts(q);
      res.json({ items });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Catalog query failed' });
    }
  },
  async countProducts(req, res) {
    try {
      const q = {
        categoryName: req.query.categoryName,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        onlyFiveStar: req.query.onlyFiveStar === 'true',
      };
      const count = await service.countProducts(q);
      res.json({ total: count });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Catalog count failed' });
    }
  },
};

module.exports = CatalogController;
