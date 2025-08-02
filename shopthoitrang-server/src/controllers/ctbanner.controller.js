const service = require('../services/ctbanner.service');

const CTBannerController = {
  async getAll(req, res) {
    const data = await service.getAll();
    res.json(data.map(d => d.toJSON()));
  },

  async getByMaBanner(req, res) {
    const data = await service.getByMaBanner(req.params.maBanner);
    res.json(data.map(d => d.toJSON()));
  },

  async create(req, res) {
    const created = await service.create(req.body);
    if (!created) return res.status(400).json({ message: 'Tạo thất bại.' });
    res.status(201).json(created.toJSON());
  },

  async delete(req, res) {
    const { maBanner, maNhanVien } = req.params;
    const ok = await service.delete(maBanner, maNhanVien);
    if (!ok) return res.status(400).json({ message: 'Xoá thất bại.' });
    res.json({ message: 'Xoá thành công.' });
  }
};

module.exports = CTBannerController;
