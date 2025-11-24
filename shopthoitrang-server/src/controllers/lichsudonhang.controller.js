const service = require('../services/lichsudonhang.service');

const LichSuDonHangController = {
  /**
   * GET /api/lichsudonhang?madonhang=123
   * GET /api/lichsudonhang?manhanvien=5
   */
  async getAll(req, res) {
    try {
      const filters = {
        madonhang: req.query.madonhang ? Number(req.query.madonhang) : undefined,
        manhanvien: req.query.manhanvien ? Number(req.query.manhanvien) : undefined,
        from: req.query.from,
        to: req.query.to,
      };
      
      const items = await service.getAll(filters);
      res.json(items.map(x => x.toJSON()));
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  /**
   * GET /api/lichsudonhang/order/:madonhang
   */
  async getByOrder(req, res) {
    try {
      const items = await service.getOrderHistory(Number(req.params.madonhang));
      res.json(items.map(x => x.toJSON()));
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },
};

module.exports = LichSuDonHangController;
