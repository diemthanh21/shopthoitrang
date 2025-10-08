const repo = require('../repositories/chitietsanpham.repository');

function lenLE(str, n) { return typeof str !== 'string' || str.length <= n; }

class ChiTietSanPhamService {
  async list(params) {
    return repo.getAll(params || {});
  }

  async get(id) {
    const item = await repo.getById(Number(id));
    if (!item) {
      const e = new Error('Không tìm thấy chi tiết sản phẩm');
      e.status = 404; throw e;
    }
    return item;
  }

  async create(body) {
    // Validate bắt buộc
    if (!body.masanpham || Number.isNaN(Number(body.masanpham))) {
      const e = new Error('masanpham là số và bắt buộc'); e.status = 400; throw e;
    }
    if (body.giaban === undefined || Number.isNaN(Number(body.giaban))) {
      const e = new Error('giaban là số và bắt buộc'); e.status = 400; throw e;
    }
    if (Number(body.giaban) < 0) {
      const e = new Error('giaban không được âm'); e.status = 400; throw e;
    }
    if (body.soluongton !== undefined && Number(body.soluongton) < 0) {
      const e = new Error('soluongton không được âm'); e.status = 400; throw e;
    }
    // Validate độ dài
    if (!lenLE(body.kichthuoc ?? '', 10)) { const e = new Error('kichthuoc tối đa 10 ký tự'); e.status = 400; throw e; }
    if (!lenLE(body.mausac ?? '', 50)) { const e = new Error('mausac tối đa 50 ký tự'); e.status = 400; throw e; }
    if (!lenLE(body.chatlieu ?? '', 50)) { const e = new Error('chatlieu tối đa 50 ký tự'); e.status = 400; throw e; }
    if (!lenLE(body.mota ?? '', 100)) { const e = new Error('mota tối đa 100 ký tự'); e.status = 400; throw e; }

    const payload = {
      masanpham: Number(body.masanpham),
      kichthuoc: body.kichthuoc?.trim() ?? null,
      mausac: body.mausac?.trim() ?? null,
      chatlieu: body.chatlieu?.trim() ?? null,
      mota: body.mota?.trim() ?? null,
      giaban: Number(body.giaban),
      soluongton: body.soluongton !== undefined ? Number(body.soluongton) : 0,
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const fields = {};

    if (body.masanpham !== undefined) {
      if (Number.isNaN(Number(body.masanpham))) { const e = new Error('masanpham phải là số'); e.status = 400; throw e; }
      fields.masanpham = Number(body.masanpham);
    }
    if (body.giaban !== undefined) {
      if (Number.isNaN(Number(body.giaban))) { const e = new Error('giaban phải là số'); e.status = 400; throw e; }
      if (Number(body.giaban) < 0) { const e = new Error('giaban không được âm'); e.status = 400; throw e; }
      fields.giaban = Number(body.giaban);
    }
    if (body.soluongton !== undefined) {
      if (Number.isNaN(Number(body.soluongton))) { const e = new Error('soluongton phải là số'); e.status = 400; throw e; }
      if (Number(body.soluongton) < 0) { const e = new Error('soluongton không được âm'); e.status = 400; throw e; }
      fields.soluongton = Number(body.soluongton);
    }

    if (body.kichthuoc !== undefined) {
      if (!lenLE(body.kichthuoc ?? '', 10)) { const e = new Error('kichthuoc tối đa 10 ký tự'); e.status = 400; throw e; }
      fields.kichthuoc = body.kichthuoc?.trim() ?? null;
    }
    if (body.mausac !== undefined) {
      if (!lenLE(body.mausac ?? '', 50)) { const e = new Error('mausac tối đa 50 ký tự'); e.status = 400; throw e; }
      fields.mausac = body.mausac?.trim() ?? null;
    }
    if (body.chatlieu !== undefined) {
      if (!lenLE(body.chatlieu ?? '', 50)) { const e = new Error('chatlieu tối đa 50 ký tự'); e.status = 400; throw e; }
      fields.chatlieu = body.chatlieu?.trim() ?? null;
    }
    if (body.mota !== undefined) {
      if (!lenLE(body.mota ?? '', 100)) { const e = new Error('mota tối đa 100 ký tự'); e.status = 400; throw e; }
      fields.mota = body.mota?.trim() ?? null;
    }

    const updated = await repo.update(Number(id), fields);
    if (!updated) {
      const e = new Error('Không tìm thấy chi tiết sản phẩm để cập nhật'); e.status = 404; throw e;
    }
    return updated;
  }

  async remove(id) {
    const deleted = await repo.remove(Number(id));
    if (!deleted) {
      const e = new Error('Không tìm thấy chi tiết sản phẩm để xoá'); e.status = 404; throw e;
    }
    return { message: 'Đã xoá chi tiết sản phẩm thành công' };
  }
}

module.exports = new ChiTietSanPhamService();
