const service = require('../services/chitietsanpham.service');

const ChiTietSanPhamController = {
  async getAll(req, res) {
    const data = await service.layTatCa();
    res.json(data);
  },

  async getById(req, res) {
    const data = await service.layTheoMa(req.params.id);
    if (!data) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(data);
  },

  async getBySanPham(req, res) {
    const data = await service.layTheoMaSanPham(req.params.maSanPham);
    res.json(data);
  },

  async create(req, res) {
    const data = await service.taoMoi(req.body);
    if (!data) return res.status(400).json({ message: 'Không thể tạo' });
    res.status(201).json(data);
  },

  async update(req, res) {
    const data = await service.capNhat(req.params.id, req.body);
    if (!data) return res.status(400).json({ message: 'Không thể cập nhật' });
    res.json(data);
  },

  async delete(req, res) {
    const data = await service.xoa(req.params.id);
    if (!data) return res.status(400).json({ message: 'Không thể xoá' });
    res.json(data);
  },

  async searchByKeyword(req, res) {
    const data = await service.timKiemTheoTuKhoa(req.params.keyword);
    res.json(data);
  }
};

module.exports = ChiTietSanPhamController;