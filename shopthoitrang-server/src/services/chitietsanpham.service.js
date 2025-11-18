const repo = require('../repositories/chitietsanpham.repository');
const sizeRepo = require('../repositories/chitietsanphamSize.repository');

function lenLE(str, n) {
  return typeof str !== 'string' || str.length <= n;
}

const normalizeSizeRow = (row) => {
  const info = row?.kichthuocs ?? {};
  return {
    id: row?.id ?? null,
    maKichThuoc: row?.makichthuoc ?? info?.makichthuoc ?? null,
    tenKichThuoc: info?.ten_kichthuoc ?? null,
    moTa: info?.mo_ta ?? null,
    soLuong: Number(row?.so_luong ?? 0),

  };
};

class ChiTietSanPhamService {
  async list(params) {
    return repo.getAll(params || {});
  }

  async get(id) {
    const item = await repo.getById(Number(id));
    if (!item) {
      const e = new Error('Product detail not found');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    if (!body.masanpham || Number.isNaN(Number(body.masanpham))) {
      const e = new Error('masanpham must be a number');
      e.status = 400;
      throw e;
    }
    if (body.giaban === undefined || Number.isNaN(Number(body.giaban))) {
      const e = new Error('giaban must be a number');
      e.status = 400;
      throw e;
    }
    if (Number(body.giaban) < 0) {
      const e = new Error('giaban cannot be negative');
      e.status = 400;
      throw e;
    }
    if (body.soluongton !== undefined && Number(body.soluongton) < 0) {
      const e = new Error('soluongton cannot be negative');
      e.status = 400;
      throw e;
    }
    if (!lenLE(body.kichthuoc ?? '', 10)) {
      const e = new Error('kichthuoc max length is 10');
      e.status = 400;
      throw e;
    }
    if (!lenLE(body.mausac ?? '', 50)) {
      const e = new Error('mausac max length is 50');
      e.status = 400;
      throw e;
    }
    if (!lenLE(body.chatlieu ?? '', 50)) {
      const e = new Error('chatlieu max length is 50');
      e.status = 400;
      throw e;
    }
    if (!lenLE(body.mota ?? '', 100)) {
      const e = new Error('mota max length is 100');
      e.status = 400;
      throw e;
    }

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
      if (Number.isNaN(Number(body.masanpham))) {
        const e = new Error('masanpham must be a number');
        e.status = 400;
        throw e;
      }
      fields.masanpham = Number(body.masanpham);
    }
    if (body.giaban !== undefined) {
      if (Number.isNaN(Number(body.giaban))) {
        const e = new Error('giaban must be a number');
        e.status = 400;
        throw e;
      }
      if (Number(body.giaban) < 0) {
        const e = new Error('giaban cannot be negative');
        e.status = 400;
        throw e;
      }
      fields.giaban = Number(body.giaban);
    }
    if (body.soluongton !== undefined) {
      if (Number.isNaN(Number(body.soluongton))) {
        const e = new Error('soluongton must be a number');
        e.status = 400;
        throw e;
      }
      if (Number(body.soluongton) < 0) {
        const e = new Error('soluongton cannot be negative');
        e.status = 400;
        throw e;
      }
      fields.soluongton = Number(body.soluongton);
    }

    if (body.kichthuoc !== undefined) {
      if (!lenLE(body.kichthuoc ?? '', 10)) {
        const e = new Error('kichthuoc max length is 10');
        e.status = 400;
        throw e;
      }
      fields.kichthuoc = body.kichthuoc?.trim() ?? null;
    }
    if (body.mausac !== undefined) {
      if (!lenLE(body.mausac ?? '', 50)) {
        const e = new Error('mausac max length is 50');
        e.status = 400;
        throw e;
      }
      fields.mausac = body.mausac?.trim() ?? null;
    }
    if (body.chatlieu !== undefined) {
      if (!lenLE(body.chatlieu ?? '', 50)) {
        const e = new Error('chatlieu max length is 50');
        e.status = 400;
        throw e;
      }
      fields.chatlieu = body.chatlieu?.trim() ?? null;
    }
    if (body.mota !== undefined) {
      if (!lenLE(body.mota ?? '', 100)) {
        const e = new Error('mota max length is 100');
        e.status = 400;
        throw e;
      }
      fields.mota = body.mota?.trim() ?? null;
    }

    const updated = await repo.update(Number(id), fields);
    if (!updated) {
      const e = new Error('Product detail not found for update');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async remove(id) {
    const deleted = await repo.remove(Number(id));
    if (!deleted) {
      const e = new Error('Product detail not found for delete');
      e.status = 404;
      throw e;
    }
    return { message: 'Deleted product detail successfully' };
  }

  async getSizes(variantId) {
    const rows = await sizeRepo.listByVariant(Number(variantId));
    return rows.map(normalizeSizeRow);
  }

  async replaceSizes(variantId, items) {
    const list = Array.isArray(items) ? items : items?.sizes;
    const filtered = Array.isArray(list) ? list : [];
    const sanitized = filtered
      .map((row) => ({
        makichthuoc: Number(row.maKichThuoc ?? row.makichthuoc),
        so_luong: Number(row.soLuong ?? row.so_luong ?? 0),
    
      }))
      .filter((row) => Number.isFinite(row.makichthuoc) && row.makichthuoc > 0);

    const saved = await sizeRepo.replaceForVariant(Number(variantId), sanitized);
    const normalized = saved.map(normalizeSizeRow);
    const totalStock = sanitized.reduce((sum, row) => sum + (row.so_luong ?? 0), 0);
    const firstSizeName = normalized[0]?.tenKichThuoc ?? null;

    const updateFields = { soluongton: totalStock };
    updateFields.kichthuoc = firstSizeName ?? null;
    await repo.update(Number(variantId), updateFields);

    return normalized;
  }
}

module.exports = new ChiTietSanPhamService();
