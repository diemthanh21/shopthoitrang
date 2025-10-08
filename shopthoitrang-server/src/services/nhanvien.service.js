const repo = require('../repositories/nhanvien.repository');

class NhanVienService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy nhân viên');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.hoten || !body.machucnang) {
      const e = new Error('Thiếu thông tin bắt buộc: hoten, machucnang');
      e.status = 400;
      throw e;
    }

    const payload = {
      hoten: body.hoten,
      email: body.email ?? null,
      sodienthoai: body.sodienthoai ?? null,
      ngaysinh: body.ngaysinh ?? null, // ISO datetime (Postgres TIMESTAMP)
      diachi: body.diachi ?? null,
      machucnang: body.machucnang,
      maquanly: body.maquanly ?? null
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy nhân viên để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy nhân viên để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá nhân viên thành công' };
  }
}

module.exports = new NhanVienService();
