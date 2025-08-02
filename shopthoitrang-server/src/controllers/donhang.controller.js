const service = require('../services/donhang.service');

const DonHangController = {
  async getAll(req, res) {
    const list = await service.getAll();
    res.json(list.map(i => i.toJSON()));
  },

  async getById(req, res) {
    const item = await service.getById(req.params.maDonHang); // SỬA lại từ id -> maDonHang
    if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(item.toJSON());
  },

  async getByMaKhachHang(req, res) { // Đổi tên cho đúng với router
    const list = await service.findByKhachHang(req.params.maKhachHang); // SỬA lại từ maKH -> maKhachHang
    res.json(list.map(i => i.toJSON()));
  },

  async create(req, res) {
    const item = await service.create(req.body);
    if (!item) return res.status(400).json({ message: 'Tạo thất bại' });
    res.status(201).json(item.toJSON());
  },

  async update(req, res) {
    const item = await service.update(req.params.maDonHang, req.body); // SỬA lại từ id -> maDonHang
    if (!item) return res.status(400).json({ message: 'Cập nhật thất bại' });
    res.json(item.toJSON());
  },

  async delete(req, res) {
    const ok = await service.delete(req.params.maDonHang); // SỬA lại từ id -> maDonHang
    if (!ok) return res.status(400).json({ message: 'Xoá thất bại' });
    res.json({ message: 'Xoá thành công' });
  }
};

module.exports = DonHangController;