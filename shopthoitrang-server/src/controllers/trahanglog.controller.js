const trahangLogRepo = require('../repositories/trahanglog.repository');
const trahangRepo = require('../repositories/trahang.repository');

module.exports = {
  async list(req, res) {
    try {
      const id = req.params.id;
      const record = await trahangRepo.getById(id);
      if (!record) return res.status(404).json({ message: 'Không tìm thấy phiếu trả hàng' });
      const logs = await trahangLogRepo.list(id);
      res.json(logs);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
};
