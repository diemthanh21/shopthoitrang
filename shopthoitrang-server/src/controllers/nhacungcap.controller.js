const service = require('../services/nhacungcap.service');

const NhaCungCapController = {
  async getAll(req, res) {
    const result = await service.getAll();
    res.json(result.map(ncc => ncc.toJSON()));
  },

  async getById(req, res) {
    const item = await service.getById(req.params.maNhaCungCap);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(item.toJSON());
  },

  async search(req, res) {
    const { ten } = req.query;
    const result = await service.findByName(ten || '');
    res.json(result.map(ncc => ncc.toJSON()));
  },

  async create(req, res) {
    const created = await service.create(req.body);
    if (!created) return res.status(400).json({ message: 'Tạo thất bại' });
    res.status(201).json(created.toJSON());
  },

  async update(req, res) {
    const updated = await service.update(req.params.maNhaCungCap, req.body);
    if (!updated) return res.status(400).json({ message: 'Cập nhật thất bại' });
    res.json(updated.toJSON());
  },

  async delete(req, res) {
    const ok = await service.delete(req.params.maNhaCungCap);
    if (!ok) return res.status(400).json({ message: 'Xoá thất bại' });
    res.json({ message: 'Xoá thành công' });
  }
};

module.exports = NhaCungCapController;
