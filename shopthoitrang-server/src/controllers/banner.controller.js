const service = require('../services/banner.service');

const BannerController = {
  async getAll(req, res) {
    const result = await service.layTatCa();
    res.json(result);
  },

  async getById(req, res) {
    const banner = await service.layTheoMa(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Không tìm thấy banner.' });
    res.json(banner);
  },

  async create(req, res) {
    const banner = await service.taoMoi(req.body);
    if (!banner) return res.status(400).json({ message: 'Không thể tạo banner.' });
    res.status(201).json(banner);
  },

  async update(req, res) {
    const banner = await service.capNhat(req.params.id, req.body);
    if (!banner) return res.status(400).json({ message: 'Không thể cập nhật banner.' });
    res.json(banner);
  },

  async delete(req, res) {
    const banner = await service.xoa(req.params.id);
    if (!banner) return res.status(400).json({ message: 'Không thể xoá banner.' });
    res.json({ message: 'Đã xoá banner.' });
  },

  async searchByStatus(req, res) {
    const banners = await service.timTheoTrangThai(req.params.status === 'true');
    res.json(banners);
  }
};

module.exports = BannerController;