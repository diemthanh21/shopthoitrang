const service = require('../services/phieunhapkho.service');

const PhieuNhapKhoController = {
  async getAll(req, res) {
    const list = await service.getAll();
    res.json(list.map(i => i.toJSON()));
  },

  async getById(req, res) {
    const item = await service.getById(req.params.maPhieuNhap);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(item.toJSON());
  },

  async findByNhanVien(req, res) {
    const list = await service.findByNhanVien(req.params.maNhanVien);
    res.json(list.map(i => i.toJSON()));
  },

  async findByNhaCungCap(req, res) {
    const list = await service.findByNhaCungCap(req.params.maNhaCungCap);
    res.json(list.map(i => i.toJSON()));
  },

  async findByNgayNhap(req, res) {
    const list = await service.findByNgayNhap(req.params.ngayNhap);
    res.json(list.map(i => i.toJSON()));
  },

  async create(req, res) {
    const item = await service.create(req.body);
    if (!item) return res.status(400).json({ message: 'Tạo thất bại' });
    res.status(201).json(item.toJSON());
  },

  async update(req, res) {
    const item = await service.update(req.params.maPhieuNhap, req.body);
    if (!item) return res.status(400).json({ message: 'Cập nhật thất bại' });
    res.json(item.toJSON());
  },

  async delete(req, res) {
    const ok = await service.delete(req.params.maPhieuNhap);
    if (!ok) return res.status(400).json({ message: 'Xoá thất bại' });
    res.json({ message: 'Xoá thành công' });
  }
};

module.exports = PhieuNhapKhoController;
