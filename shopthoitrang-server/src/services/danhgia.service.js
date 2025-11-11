const repo = require('../repositories/danhgia.repository');

class DanhGiaService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy đánh giá');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.masanpham || !body.makhachhang || !body.diemdanhgia) {
      const e = new Error('Thiếu thông tin bắt buộc: masanpham, makhachhang, diemdanhgia');
      e.status = 400;
      throw e;
    }

    const diemdanhgia = Number(body.diemdanhgia);
    if (diemdanhgia < 1 || diemdanhgia > 5) {
      const e = new Error('Điểm đánh giá phải trong khoảng 1-5');
      e.status = 400;
      throw e;
    }

    body.ngaydanhgia = body.ngaydanhgia || new Date().toISOString();
    return repo.create(body);
  }

  async update(id, body) {
    // Auto-set timestamp when admin replies
    if (body.phanhoitushop && body.phanhoitushop.trim()) {
      body.ngayphanhoitushop = new Date().toISOString();
      body.dadocbyadmin = true;
      if (!body.ngayadmindoc) {
        body.ngayadmindoc = new Date().toISOString();
      }
    }
    
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy đánh giá để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async markAsRead(id) {
    const now = new Date().toISOString();
    const updated = await repo.update(id, { 
      dadocbyadmin: true, 
      ngayadmindoc: now 
    });
    if (!updated) {
      const e = new Error('Không tìm thấy đánh giá');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy đánh giá để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá đánh giá thành công' };
  }
}

module.exports = new DanhGiaService();
