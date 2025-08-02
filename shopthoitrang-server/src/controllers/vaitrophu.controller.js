const service = require('../services/vaitrophu.service');

const VaiTroPhuController = {
  async getAll(req, res) {
    const data = await service.getAll();
    res.json(data.map(i => i.toJSON()));
  },

  async getById(req, res) {
    const item = await service.getById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy vai trò phụ.' });
    res.json(item.toJSON());
  },

  async create(req, res) {
    const created = await service.create(req.body);
    if (!created) return res.status(400).json({ message: 'Tạo thất bại.' });
    res.status(201).json(created.toJSON());
  },

  async update(req, res) {
    const updated = await service.update(req.params.id, req.body);
    if (!updated) return res.status(400).json({ message: 'Cập nhật thất bại.' });
    res.json(updated.toJSON());
  },

  async delete(req, res) {
    const ok = await service.delete(req.params.id);
    if (!ok) return res.status(400).json({ message: 'Xoá thất bại.' });
    res.json({ message: 'Xoá thành công.' });
  }
};

module.exports = VaiTroPhuController;
