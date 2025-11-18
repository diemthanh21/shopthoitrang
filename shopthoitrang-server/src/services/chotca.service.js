const repo = require('../repositories/chotca.repository');

class ChotCaService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy chốt ca');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    console.log('📝 ChotCa Service - Create body:', JSON.stringify(body, null, 2));
    
    if (!body.manhanvien || !body.ngaychotca) {
      console.log('❌ Missing required fields:', { 
        manhanvien: body.manhanvien, 
        ngaychotca: body.ngaychotca 
      });
      const e = new Error('Thiếu thông tin bắt buộc: manhanvien, ngaychotca');
      e.status = 400;
      throw e;
    }

    // Prevent duplicate close-shift per employee + date unless previous is cancelled
    const existingList = await repo.findByEmployeeAndDate(body.manhanvien, body.ngaychotca);
    const hasActive = (existingList || []).some((r) => {
      const st = (r.trangthai || '').toLowerCase();
      // treat anything except explicit cancel as active
      return st !== 'đã hủy' && st !== 'đã huỷ' && st !== 'hủy' && st !== 'huỷ';
    });
    if (hasActive) {
      const e = new Error('Đã tồn tại chốt ca cho nhân viên này trong ngày này. Chỉ được chốt ca một lần/ngày. Vui lòng yêu cầu quản lý hủy bản cũ trước khi tạo lại.');
      e.status = 409;
      throw e;
    }

    // Whitelist & normalize only allowed columns (avoid stray legacy column names like 'tongchi')
    const payload = {
      manhanvien: body.manhanvien,
      ngaychotca: body.ngaychotca,
      tongthu: Number(body.tongthu) || 0,
      tienmat: Number(body.tienmat) || 0,
      tienchi: Number(body.tienchi) || 0,
      tienchuyenkhoan: Number(body.tienchuyenkhoan) || 0,
      soluongdonhang: Number(body.soluongdonhang) || 0,
      chenhlechtienmat: body.chenhlechtienmat ?? null,
      ghichu: body.ghichu ?? null,
      trangthai: body.trangthai || 'Chờ duyệt',
    };

    console.log('✅ Creating chotca with payload:', JSON.stringify(payload, null, 2));
    return repo.create(payload);
  }

  async update(id, body) {
    // Sanitize & whitelist fields; map legacy 'tongchi' -> 'tienchi' if provided
    const allowed = {};
    if (body.tongthu !== undefined) allowed.tongthu = Number(body.tongthu) || 0;
    if (body.tienmat !== undefined) allowed.tienmat = Number(body.tienmat) || 0;
    // Prefer explicit tienchi; fallback to legacy tongchi if present
    if (body.tienchi !== undefined) {
      allowed.tienchi = Number(body.tienchi) || 0;
    } else if (body.tongchi !== undefined) {
      allowed.tienchi = Number(body.tongchi) || 0; // map old column name
    }
    if (body.tienchuyenkhoan !== undefined) allowed.tienchuyenkhoan = Number(body.tienchuyenkhoan) || 0;
    if (body.soluongdonhang !== undefined) allowed.soluongdonhang = Number(body.soluongdonhang) || 0;
    if (body.chenhlechtienmat !== undefined) allowed.chenhlechtienmat = body.chenhlechtienmat;
    if (body.ghichu !== undefined) allowed.ghichu = body.ghichu;
    if (body.nguoiduyet !== undefined) allowed.nguoiduyet = body.nguoiduyet;
    if (body.ngayduyet !== undefined) allowed.ngayduyet = body.ngayduyet;
    if (body.trangthai !== undefined) allowed.trangthai = body.trangthai;
    // Ignore any stray legacy fields (maphancong, maca, tongchi, etc.) by not copying them

    const updated = await repo.update(id, allowed);
    if (!updated) {
      const e = new Error('Không tìm thấy chốt ca để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy chốt ca để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá chốt ca thành công' };
  }
}

module.exports = new ChotCaService();
