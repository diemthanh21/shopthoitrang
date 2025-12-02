const repo = require('../repositories/phieudathang.repository');
const systemlogController = require('../controllers/systemlog.controller');

// Hàm đổi về giờ Việt Nam (UTC+7) rồi trả ra ISO string
function toVietnamTimeIso(input) {
  const base = input ? new Date(input) : new Date();
  const ms = base.getTime() + 7 * 60 * 60 * 1000; // +7 giờ
  return new Date(ms).toISOString();
}

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
    // luôn lưu ngaydatphieu / ngayhendukien theo UTC+7
    const payload = {
      manhacungcap: body.manhacungcap ?? body.manacungcap ?? null,
      manhanvien: body.manhanvien ?? null,
      // nếu FE gửi ngày thì +7h, nếu không gửi thì lấy now +7h
      ngaydatphieu: toVietnamTimeIso(body.ngaydatphieu || undefined),
      ngayhendukien: body.ngayhendukien ? toVietnamTimeIso(body.ngayhendukien) : null,
      tongtien: body.tongtien,
      tiencoc: body.tiencoc ?? 0,
      conlai: body.conlai ?? body.tongtien - (body.tiencoc ?? 0),
      phuongthucthanhtoan: body.phuongthucthanhtoan ?? 'Tiền mặt',
      trangthaiphieu: body.trangthaiphieu ?? 'Chờ xác nhận',
      ghichu: body.ghichu ?? null
    };

    const created = await repo.create(payload);
    
    // Nếu tạo với trạng thái "Chờ xác nhận", tạo thông báo cho quản lý
    if (created && payload.trangthaiphieu === 'Chờ xác nhận') {
      try {
        await systemlogController.createPhieuDatHangLog(
          created.maphieudathang,
          payload.manhanvien || 'SYSTEM',
          'CREATED',
          'Phiếu đặt hàng mới đã được tạo, chờ duyệt',
          'NHANVIEN'
        );
        console.log('✅ Created notification for new phieudathang:', created.maphieudathang);
      } catch (logErr) {
        console.error('⚠️ Failed to create notification:', logErr);
      }
    }
    
    return created;
  }

  async update(id, body) {
    // Lấy trạng thái cũ trước khi update để so sánh
    const oldData = await repo.getById(id);
    const oldStatus = oldData?.trangThaiPhieu;

    // clone body ra để chỉnh các field ngày nhưng giữ nguyên field khác
    const updateBody = { ...body };

    // Nếu có truyền các ngày thì +7h trước khi lưu
    if (body.ngaydatphieu !== undefined) {
      updateBody.ngaydatphieu = toVietnamTimeIso(body.ngaydatphieu || undefined);
    }
    if (body.ngayhendukien !== undefined) {
      updateBody.ngayhendukien = body.ngayhendukien
        ? toVietnamTimeIso(body.ngayhendukien)
        : null;
    }
    // Nếu sau này bạn có cột ngayduyet trong phiếu, FE gửi lên thì cũng +7h tương tự:
    if (body.ngayduyet !== undefined) {
      updateBody.ngayduyet = toVietnamTimeIso(body.ngayduyet || undefined);
    }
    
    const updated = await repo.update(id, updateBody);
    if (!updated) {
      const e = new Error('Không tìm thấy phiếu đặt hàng để cập nhật');
      e.status = 404;
      throw e;
    }
    
    // Chỉ tạo log khi trạng thái THAY ĐỔI
    if (body.trangthaiphieu && body.trangthaiphieu !== oldStatus) {
      try {
        console.log('📋 Phiếu đặt hàng #' + id + ' - Trạng thái thay đổi:', oldStatus, '→', body.trangthaiphieu);
        console.log('📋 oldData.maNhanVien:', oldData?.maNhanVien);
        
        let action = null;
        let note = null;
        let actorType = 'ADMIN';
        let actorId = 'SYSTEM';
        
        if (body.trangthaiphieu === 'Đã duyệt') {
          action = 'APPROVED';
          note = `Phiếu đặt hàng đã được duyệt${body.nguoiduyet ? ` bởi quản lý` : ''}`;
          actorType = 'ADMIN';
          actorId = oldData?.maNhanVien || 'SYSTEM';
          console.log('✅ Action: APPROVED, actorId:', actorId);
        } else if (body.trangthaiphieu === 'Từ chối' || body.trangthaiphieu === 'Đã hủy') {
          action = 'REJECTED';
          note = `Phiếu đặt hàng bị từ chối${body.ghichu ? `: ${body.ghichu}` : ''}`;
          actorType = 'ADMIN';
          actorId = oldData?.maNhanVien || 'SYSTEM';
          console.log('✅ Action: REJECTED, actorId:', actorId);
        } else if (body.trangthaiphieu === 'Hoàn thành') {
          // Khi chuyển sang Hoàn thành, gửi thông báo cho quản lý
          action = 'COMPLETED';
          note = 'Phiếu đặt hàng đã hoàn thành';
          actorType = 'NHANVIEN';
          actorId = oldData?.maNhanVien || 'SYSTEM'; // ID nhân viên tạo phiếu
          console.log('✅ Action: COMPLETED, actorId:', actorId);
        } else if (body.trangthaiphieu === 'Chờ xác nhận' && oldStatus !== 'Chờ xác nhận') {
          action = 'CREATED';
          note = 'Phiếu đặt hàng đã được gửi, chờ duyệt';
          actorType = 'NHANVIEN';
          actorId = oldData?.maNhanVien || body.manhanvien || 'SYSTEM';
          console.log('✅ Action: CREATED, actorId:', actorId);
        }
        
        if (action) {
          await systemlogController.createPhieuDatHangLog(
            id,
            actorId,
            action,
            note,
            actorType
          );
          console.log('✅ Created status update log for phieudathang:', id, 'action:', action, 'actorId:', actorId, 'actorType:', actorType);
        } else {
          console.log('⚠️ Không có action nào được tạo cho trạng thái:', body.trangthaiphieu);
        }
      } catch (logErr) {
        console.error('⚠️ Failed to create status update log:', logErr);
      }
    } else {
      if (body.trangthaiphieu) {
        console.log('ℹ️ Trạng thái không đổi:', body.trangthaiphieu);
      }
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
