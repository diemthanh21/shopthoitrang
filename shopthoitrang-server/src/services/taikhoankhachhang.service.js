const repo = require('../repositories/taikhoankhachhang.repository');
const bcrypt = require('bcryptjs');

class TaiKhoanKhachHangService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy khách hàng');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    const required = ['hoten', 'tendangnhap', 'pass'];
    for (const f of required) {
      if (!body[f]) {
        const e = new Error(`Thiếu thông tin bắt buộc: ${f}`);
        e.status = 400;
        throw e;
      }
    }

    const hashedPassword = await bcrypt.hash(body.pass, 10);

    const payload = {
      hoten: body.hoten,
      tendangnhap: body.tendangnhap,
      email: body.email ?? null,
      pass: hashedPassword,
      sodienthoai: body.sodienthoai ?? null,
      danghoatdong: body.danghoatdong ?? true,
      anhdaidien: body.anhdaidien ?? null
    };

    return repo.create(payload);
  }

  async update(id, body) {
    if (body.pass) {
      body.pass = await bcrypt.hash(body.pass, 10);
    }

    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy khách hàng để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy khách hàng để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá tài khoản khách hàng thành công' };
  }
}

module.exports = new TaiKhoanKhachHangService();
