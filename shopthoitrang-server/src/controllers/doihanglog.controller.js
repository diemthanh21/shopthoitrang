const doihangLogRepo = require('../repositories/doihanglog.repository');
const doihangRepo = require('../repositories/doihang.repository');

module.exports = {
  async list(req, res) {
    try {
      const id = req.params.id;
      const record = await doihangRepo.getById(id);
      if (!record) return res.status(404).json({ message: 'Không tìm thấy phiếu đổi hàng' });
      const logs = await doihangLogRepo.list(id);
      res.json(logs);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
};
