const repo = require('../repositories/tichluy_chitieu.repository');

class TichLuyChiTieuService {
  async list() {
    return repo.getAll();
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy bản ghi tích luỹ chi tiêu');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.makh || !body.nam) {
      const e = new Error('Thiếu thông tin bắt buộc: makh, nam');
      e.status = 400;
      throw e;
    }

    const payload = {
      makh: body.makh,
      nam: body.nam,
      tongchi_nam: body.tongchi_nam ?? 0,
      tongchi_tichluy: body.tongchi_tichluy ?? 0,
      ngaycapnhat: body.ngaycapnhat ?? new Date().toISOString()
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
    return { message: 'Đã xoá bản ghi tích luỹ chi tiêu thành công' };
  }
}

module.exports = new TichLuyChiTieuService();
