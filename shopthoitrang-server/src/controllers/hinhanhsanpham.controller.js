const service = require('../services/hinhanhsanpham.service');

const HinhAnhSanPhamController = {
  async getAll(req, res) {
    const data = await service.layTatCa();
    res.json(data);
  },

  async getById(req, res) {
    const data = await service.layTheoMa(req.params.maHinhAnh);
    if (!data) return res.status(404).json({ message: 'Không tìm thấy.' });
    res.json(data);
  },

  async getByChiTietSanPham(req, res) {
    const data = await service.layTheoChiTietSP(req.params.maChiTietSanPham);
    res.json(data);
  },

  async create(req, res) {
    const data = await service.taoMoi(req.body);
    if (!data) return res.status(400).json({ message: 'Tạo thất bại' });
    res.status(201).json(data);
  },

  async update(req, res) {
    const data = await service.capNhat(req.params.maHinhAnh, req.body);
    if (!data) return res.status(400).json({ message: 'Cập nhật thất bại' });
    res.json(data);
  },

  async delete(req, res) {
    const data = await service.xoa(req.params.maHinhAnh);
    if (!data) return res.status(400).json({ message: 'Xoá thất bại' });
    res.json(data);
  }
};

module.exports = HinhAnhSanPhamController;