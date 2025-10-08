const repo = require('../repositories/taikhoannhanvien.repository');
const bcrypt = require('bcryptjs');

class TaiKhoanNhanVienService {
  async list() {
    return repo.getAll();
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy tài khoản nhân viên');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.manhanvien || !body.tendangnhap || !body.matkhau) {
      const e = new Error('Thiếu thông tin bắt buộc (manhanvien, tendangnhap, matkhau)');
      e.status = 400;
      throw e;
    }

    const existing = await repo.getByUsername(body.tendangnhap);
    if (existing) {
      const e = new Error('Tên đăng nhập đã tồn tại');
      e.status = 400;
      throw e;
    }

    const hashedPassword = await bcrypt.hash(body.matkhau, 10);
    const payload = {
      manhanvien: body.manhanvien,
      tendangnhap: body.tendangnhap,
      matkhau: hashedPassword,
      danghoatdong: body.danghoatdong ?? true
    };

    return repo.create(payload);
  }

  async update(id, body) {
    if (body.matkhau) {
      body.matkhau = await bcrypt.hash(body.matkhau, 10);
    }

    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy tài khoản để cập nhật');
      e.status = 404;
      throw e;
    }

    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy tài khoản để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá tài khoản nhân viên thành công' };
  }
}

module.exports = new TaiKhoanNhanVienService();
