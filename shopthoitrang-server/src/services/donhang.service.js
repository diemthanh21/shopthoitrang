const repo = require('../repositories/donhang.repository');

class DonHangService {
  async list() {
    return repo.getAll();
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy đơn hàng');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async getByCustomer(makhachhang) {
    return repo.getByCustomer(makhachhang);
  }

  async create(body) {
    if (!body.makhachhang || !body.phuongthucthanhtoan) {
      const e = new Error('Thiếu thông tin bắt buộc: makhachhang, phuongthucthanhtoan');
      e.status = 400;
      throw e;
    }
    return repo.create({
      makhachhang: body.makhachhang,
      thanhtien: body.thanhtien || 0,
      phuongthucthanhtoan: body.phuongthucthanhtoan,
      trangthaithanhtoan: body.trangthaithanhtoan || 'Chưa thanh toán',
      trangthaidonhang: body.trangthaidonhang || 'Đang xử lý',
    });
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy đơn hàng để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy đơn hàng để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá đơn hàng thành công' };
  }
}

module.exports = new DonHangService();
