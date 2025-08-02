const service = require('../services/trahang.service');

const TraHangController = {
  async getAll(req, res) {
    const list = await service.layTatCa();
    res.json(list);
  },

  async getById(req, res) {
    const item = await service.layTheoMa(req.params.ma);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(item);
  },

  async getByDonHang(req, res) {
    const list = await service.layTheoDonHang(req.params.maDonHang);
    res.json(list);
  },

  async create(req, res) {
    const item = await service.taoMoi(req.body);
    if (!item) return res.status(400).json({ message: 'Tạo thất bại' });
    res.status(201).json(item);
  },

  async update(req, res) {
    const item = await service.capNhat(req.params.ma, req.body);
    if (!item) return res.status(400).json({ message: 'Cập nhật thất bại' });
    res.json(item);
  },

  async delete(req, res) {
    const ok = await service.xoa(req.params.ma);
    if (!ok) return res.status(400).json({ message: 'Xoá thất bại' });
    res.json({ message: 'Xoá thành công' });
  }
};

module.exports = TraHangController;