// src/services/chotca.service.js
const repo = require('../repositories/chotca.repository');
const systemlogController = require('../controllers/systemlog.controller');

function toVietnamTimeIso(input) {
  // input có thể là ISO string hoặc Date; nếu không truyền thì lấy now
  const base = input ? new Date(input) : new Date();
  const ms = base.getTime() + 7 * 60 * 60 * 1000; // +7h
  return new Date(ms).toISOString();
}

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
      const st = String(r.trangthai || '').toLowerCase().trim();
      // Cho phép tạo lại nếu chốt ca đã bị hủy hoặc từ chối
      const isCancelledOrRejected =
        st.includes('hủy') || st.includes('huỷ') || st.includes('từ chối') || st.includes('tu choi');
      return !isCancelledOrRejected;
    });
    if (hasActive) {
      const e = new Error(
        'Đã tồn tại chốt ca cho nhân viên này trong ngày này. Chỉ được chốt ca một lần/ngày. Chốt ca bị từ chối hoặc hủy thì có thể tạo lại.'
      );
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
    const created = await repo.create(payload);
    
    // Tạo log thông báo cho quản lý
    try {
      await systemlogController.createChotCaLog(
        created.machotca,
        payload.manhanvien,
        'CREATED',
        `Nhân viên đã gửi báo cáo chốt ca ngày ${payload.ngaychotca}. Tổng thu: ${payload.tongthu.toLocaleString('vi-VN')}đ`
      );
      console.log('✅ Created notification log for chotca:', created.machotca);
    } catch (logErr) {
      console.error('⚠️ Failed to create notification log:', logErr);
      // Không throw error để không ảnh hưởng đến việc tạo chốt ca
    }
    
    return created;
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
    if (body.tienchuyenkhoan !== undefined)
      allowed.tienchuyenkhoan = Number(body.tienchuyenkhoan) || 0;
    if (body.soluongdonhang !== undefined)
      allowed.soluongdonhang = Number(body.soluongdonhang) || 0;
    if (body.chenhlechtienmat !== undefined)
      allowed.chenhlechtienmat = body.chenhlechtienmat;
    if (body.ghichu !== undefined) allowed.ghichu = body.ghichu;
    if (body.nguoiduyet !== undefined) allowed.nguoiduyet = body.nguoiduyet;

    // 🔥 Ngày duyệt: cộng thêm 7 tiếng cho đúng múi giờ VN
    if (body.ngayduyet !== undefined) {
      // nếu FE gửi rỗng/null thì vẫn tự lấy now
      allowed.ngayduyet = toVietnamTimeIso(body.ngayduyet || undefined);
    }

    if (body.trangthai !== undefined) allowed.trangthai = body.trangthai;
    // Ignore any stray legacy fields (maphancong, maca, tongchi, etc.) by not copying them

    const updated = await repo.update(id, allowed);
    if (!updated) {
      const e = new Error('Không tìm thấy chốt ca để cập nhật');
      e.status = 404;
      throw e;
    }
    
    // Tạo log nếu có thay đổi trạng thái
    if (body.trangthai && ['Đã duyệt', 'Từ chối'].includes(body.trangthai)) {
      try {
        const action = body.trangthai === 'Đã duyệt' ? 'APPROVED' : 'REJECTED';
        const note =
          body.trangthai === 'Đã duyệt'
            ? `Chốt ca đã được duyệt${
                body.nguoiduyet ? ` bởi quản lý #${body.nguoiduyet}` : ''
              }`
            : `Chốt ca bị từ chối${body.ghichu ? `: ${body.ghichu}` : ''}`;
        
        await systemlogController.createChotCaLog(
          id,
          body.nguoiduyet || 'SYSTEM',
          action,
          note,
          'ADMIN'
        );
        console.log('✅ Created status update log for chotca:', id);
      } catch (logErr) {
        console.error('⚠️ Failed to create status update log:', logErr);
      }
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
