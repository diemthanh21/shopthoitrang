const repo = require('../repositories/chatbox.repository');

class ChatBoxService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async taoMoi(data) {
    if (!data.makhachhang || !data.manhanvien) {
      throw new Error('Thiếu thông tin bắt buộc: makhachhang, manhanvien');
    }
    return await repo.create(data);
  }

  async capNhat(ma, data) {
    return await repo.update(ma, data);
  }

  async xoa(ma) {
    return await repo.delete(ma);
  }
}

module.exports = new ChatBoxService();
