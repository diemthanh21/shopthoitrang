const repo = require('../repositories/noidungchat.repository');

class NoiDungChatService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy tin nhắn');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async getByChatBox(machatbox) {
    return repo.getByChatBox(machatbox);
  }

  async create(body) {
    const required = ['machatbox', 'nguoigui', 'noidung'];
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === '') {
        const e = new Error(`Thiếu thông tin bắt buộc: ${k}`);
        e.status = 400;
        throw e;
      }
    }
    if (!['KH', 'NV'].includes(body.nguoigui)) {
      const e = new Error("nguoigui phải là 'KH' hoặc 'NV'");
      e.status = 400;
      throw e;
    }

    const payload = {
      machatbox: body.machatbox,
      nguoigui: body.nguoigui,
      noidung: body.noidung,
      thoigiangui: body.thoigiangui || new Date().toISOString(),
      daxem: body.daxem ?? false
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy tin nhắn để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy tin nhắn để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá tin nhắn thành công' };
  }
}

module.exports = new NoiDungChatService();
