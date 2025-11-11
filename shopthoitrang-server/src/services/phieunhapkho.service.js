const repo = require('../repositories/phieunhapkho.repository');

class PhieuNhapKhoService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy phiếu nhập kho');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    const required = ['manhanvien', 'manhacungcap'];
    for (const field of required) {
      if (!body[field]) {
        const e = new Error(`Thiếu thông tin bắt buộc: ${field}`);
        e.status = 400;
        throw e;
      }
    }

    const payload = {
      manhanvien: body.manhanvien,
      manhacungcap: body.manhacungcap,
      ngaynhap: body.ngaynhap ?? new Date().toISOString(),
      ghichu: body.ghichu ?? null
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy phiếu nhập kho để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy phiếu nhập kho để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá phiếu nhập kho thành công' };
  }
}

module.exports = new PhieuNhapKhoService();
