const sanPhamService = require('../services/sanpham.service');

const SanPhamController = {
  async getAll(req, res) {
    const list = await sanPhamService.layTatCa();
    res.json(list.map(sp => sp.toJSON()));
  },

  async getById(req, res) {
    const sp = await sanPhamService.layTheoMa(req.params.maSanPham);
    if (!sp) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    res.json(sp.toJSON());
  },

  async create(req, res) {
    const sp = await sanPhamService.taoMoi(req.body);
    if (!sp) return res.status(400).json({ message: 'Không thể tạo sản phẩm.' });
    res.status(201).json(sp.toJSON());
  },

  async update(req, res) {
    const sp = await sanPhamService.capNhat(req.params.maSanPham, req.body);
    if (!sp) return res.status(400).json({ message: 'Không thể cập nhật.' });
    res.json(sp.toJSON());
  },

  async delete(req, res) {
    const sp = await sanPhamService.xoa(req.params.maSanPham);
    if (!sp) return res.status(400).json({ message: 'Không thể xoá.' });
    res.json({ message: 'Đã xoá.', data: sp.toJSON() });
  },

  async findByDanhMuc(req, res) {
    const result = await sanPhamService.timTheoDanhMuc(req.params.maDanhMuc);
    res.json(result.map(sp => sp.toJSON()));
  },

  async findByThuongHieu(req, res) {
    const result = await sanPhamService.timTheoThuongHieu(req.params.maThuongHieu);
    res.json(result.map(sp => sp.toJSON()));
  },

  async findByTrangThai(req, res) {
    const result = await sanPhamService.timTheoTrangThai(req.params.trangThai);
    res.json(result.map(sp => sp.toJSON()));
  }
};

module.exports = SanPhamController;
