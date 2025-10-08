const repo = require('../repositories/lichsutimkiem.repository');

class LichSuTimKiemService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy lịch sử tìm kiếm');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async getByCustomer(makhachhang) {
    return repo.getByCustomer(makhachhang);
  }

  async create(body) {
    if (!body.makhachhang || !body.noidung) {
      const e = new Error('Thiếu thông tin bắt buộc: makhachhang, noidung');
      e.status = 400;
      throw e;
    }

    // Gán mặc định thời gian nếu thiếu
    const payload = {
      makhachhang: body.makhachhang,
      machitietsanpham: body.machitietsanpham ?? null,
      noidung: body.noidung,
      thoigiantk: body.thoigiantk || new Date().toISOString(),
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy bản ghi để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy bản ghi để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá lịch sử tìm kiếm thành công' };
  }
}

module.exports = new LichSuTimKiemService();
