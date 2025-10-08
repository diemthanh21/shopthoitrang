const repo = require('../repositories/trahang.repository');

class TraHangService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy yêu cầu trả hàng');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    const required = ['madonhang', 'makhachhang', 'machitietsanpham', 'soluong', 'lydo'];
    for (const f of required) {
      if (body[f] === undefined || body[f] === null || body[f] === '') {
        const e = new Error(`Thiếu thông tin bắt buộc: ${f}`);
        e.status = 400;
        throw e;
      }
    }
    if (Number(body.soluong) <= 0) {
      const e = new Error('soluong phải > 0');
      e.status = 400;
      throw e;
    }

    const payload = {
      madonhang: body.madonhang,
      makhachhang: body.makhachhang,
      machitietsanpham: body.machitietsanpham,
      soluong: body.soluong,
      lydo: body.lydo,
      hinhanhloi: body.hinhanhloi ?? null,
      ngayyeucau: body.ngayyeucau ?? new Date().toISOString(),
      trangthai: body.trangthai ?? 'CHỜ DUYỆT',
      ghichu: body.ghichu ?? null
    };

    return repo.create(payload);
  }

  async update(id, body) {
    if (body.soluong !== undefined && Number(body.soluong) <= 0) {
      const e = new Error('soluong phải > 0');
      e.status = 400;
      throw e;
    }

    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy yêu cầu để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy yêu cầu để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá yêu cầu trả hàng thành công' };
  }
}

module.exports = new TraHangService();
