const repo = require('../repositories/phieudathang.repository');

class PhieuDatHangService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy phiếu đặt hàng');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    const required = ['makhachhang', 'tongtien'];
    for (const field of required) {
      if (!body[field]) {
        const e = new Error(`Thiếu thông tin bắt buộc: ${field}`);
        e.status = 400;
        throw e;
      }
    }

    const payload = {
      makhachhang: body.makhachhang,
      manhanvien: body.manhanvien ?? null,
      ngaydatphieu: body.ngaydatphieu ?? new Date().toISOString(),
      ngayhendukien: body.ngayhendukien ?? null,
      tongtien: body.tongtien,
      tiencoc: body.tiencoc ?? 0,
      conlai: body.conlai ?? body.tongtien - (body.tiencoc ?? 0),
      phuongthucthanhtoan: body.phuongthucthanhtoan ?? 'Tiền mặt',
      trangthaiphieu: body.trangthaiphieu ?? 'Chờ xác nhận',
      ghichu: body.ghichu ?? null
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy phiếu đặt hàng để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy phiếu đặt hàng để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá phiếu đặt hàng thành công' };
  }
}

module.exports = new PhieuDatHangService();
