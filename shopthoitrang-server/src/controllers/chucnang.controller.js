const service = require('../services/chucnang.service');

const ChucNangController = {
  async getAll(req, res) {
    const list = await service.layTatCa();
    res.json(list.map(e => e.toJSON()));
  },

  async getById(req, res) {
    const ma = req.params.id;
    const item = await service.layTheoMa(ma);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(item.toJSON());
  },

  async create(req, res) {
    const item = await service.taoMoi(req.body);
    if (!item) return res.status(400).json({ message: 'Tạo thất bại' });
    res.status(201).json(item.toJSON());
  },

  async update(req, res) {
    const item = await service.capNhat(req.params.id, req.body);
    if (!item) return res.status(400).json({ message: 'Cập nhật thất bại' });
    res.json(item.toJSON());
  },

  async delete(req, res) {
    const item = await service.xoa(req.params.id);
    if (!item) return res.status(400).json({ message: 'Xoá thất bại' });
    res.json(item.toJSON());
  }
};

module.exports = ChucNangController;