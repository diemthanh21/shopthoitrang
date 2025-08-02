const repo = require('../repositories/noidungchat.repository');

class NoiDungChatService {
  async layTatCa() {
    return await repo.getAll();
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async layTheoChatBox(maChatBox) {
    return await repo.getByChatBox(maChatBox);
  }

  async taoMoi(data) {
    return await repo.create(data);
  }

  async capNhat(ma, data) {
    return await repo.update(ma, data);
  }

  async xoa(ma) {
    return await repo.delete(ma);
  }
}

module.exports = new NoiDungChatService();
