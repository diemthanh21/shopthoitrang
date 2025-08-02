const service = require('../services/danhmucsanpham.service');

const DanhMucSanPhamController = {
  async getAll(req, res) {
    const data = await service.getAll();
    res.json(data.map(d => d.toJSON()));
  },

  async getById(req, res) {
    const item = await service.getById(req.params.maDanhMuc);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(item.toJSON());
  },

  async create(req, res) {
    const created = await service.create(req.body);
    if (!created) return res.status(400).json({ message: 'Tạo thất bại' });
    res.status(201).json(created.toJSON());
  },

  async update(req, res) {
    const updated = await service.update(req.params.maDanhMuc, req.body);
    if (!updated) return res.status(400).json({ message: 'Cập nhật thất bại' });
    res.json(updated.toJSON());
  },

  async delete(req, res) {
    const ok = await service.delete(req.params.maDanhMuc);
    if (!ok) return res.status(400).json({ message: 'Xoá thất bại' });
    res.json({ message: 'Xoá thành công' });
  }
};

module.exports = DanhMucSanPhamController;
