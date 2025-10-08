const repo = require('../repositories/phancongca.repository');

class PhanCongCaService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy phân công ca');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async getByNhanVien(manhanvien, from, to) {
    return repo.getByNhanVien(manhanvien, from, to);
  }

  async create(body) {
    const required = ['manhanvien', 'maca', 'ngaylamviec'];
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === '') {
        const e = new Error(`Thiếu thông tin bắt buộc: ${k}`);
        e.status = 400;
        throw e;
      }
    }

    const payload = {
      manhanvien: body.manhanvien,
      maca: body.maca,
      ngaylamviec: body.ngaylamviec, // 'YYYY-MM-DD'
      trangthai: body.trangthai || 'Đã phân công',
      ghichu: body.ghichu ?? null,
      nguoiphancong: body.nguoiphancong ?? null,
      // ngayphancong sẽ mặc định NOW() ở DB, nhưng cho phép override nếu truyền vào
      ngayphancong: body.ngayphancong ?? null
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy phân công ca để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy phân công ca để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá phân công ca thành công' };
  }
}

module.exports = new PhanCongCaService();
