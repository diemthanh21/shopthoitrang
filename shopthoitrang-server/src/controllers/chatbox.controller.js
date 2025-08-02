const service = require('../services/chatbox.service');

const ChatBoxController = {
  async getAll(req, res) {
    const list = await service.getAll();
    res.json(list.map(i => i.toJSON()));
  },

  async getById(req, res) {
    const item = await service.getById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(item.toJSON());
  },

  async findByKhachHang(req, res) {
    const list = await service.findByKhachHang(req.params.maKhachHang);
    res.json(list.map(i => i.toJSON()));
  },

  async findByNhanVien(req, res) {
    const list = await service.findByNhanVien(req.params.maNhanVien);
    res.json(list.map(i => i.toJSON()));
  },

  async create(req, res) {
    const item = await service.create(req.body);
    if (!item) return res.status(400).json({ message: 'Tạo thất bại' });
    res.status(201).json(item.toJSON());
  },

  async update(req, res) {
    const item = await service.update(req.params.id, req.body);
    if (!item) return res.status(400).json({ message: 'Cập nhật thất bại' });
    res.json(item.toJSON());
  },

  async delete(req, res) {
    const ok = await service.delete(req.params.id);
    if (!ok) return res.status(400).json({ message: 'Xoá thất bại' });
    res.json({ message: 'Xoá thành công' });
  }
};

module.exports = ChatBoxController;
