const service = require('../services/chitietdonhang.service');

const ChiTietDonHangController = {
  async getAll(req, res) {
    try {
      const list = await service.layTatCa();
      res.json(list.map(e => e.toJSON()));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getByOrder(req, res) {
    try {
      const madonhang = req.params.madonhang;
      const list = await service.layTheoDonHang(madonhang);
      res.json(list.map(e => e.toJSON()));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const id = req.params.id;
      const item = await service.layTheoMa(id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
      res.json(item.toJSON());
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async create(req, res) {
    try {
      const item = await service.taoMoi(req.body);
      res.status(201).json(item.toJSON());
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async update(req, res) {
    try {
      const id = req.params.id;
      const item = await service.capNhat(id, req.body);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
      res.json(item.toJSON());
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const id = req.params.id;
      const item = await service.xoa(id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
      res.json({ message: 'Đã xoá thành công', item });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
};

module.exports = ChiTietDonHangController;
