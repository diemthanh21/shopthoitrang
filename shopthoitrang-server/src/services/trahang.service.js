const repo = require('../repositories/trahang.repository');
const supabase = require('../../config/db');
const chitietDonHangRepo = require('../repositories/chitietdonhang.repository');
const donhangRepo = require('../repositories/donhang.repository');
const chatboxRepo = require('../repositories/chatbox.repository');
const chatMsgRepo = require('../repositories/noidungchat.repository');
const STATUS = require('../constants/status');
const trahangLogRepo = require('../repositories/trahanglog.repository');

class TraHangService {
  _norm(s){
    return (s||'').toString().trim().toUpperCase().replace(/\s+/g,'_');
  }
  async layTatCa(filters = {}) {
    return await repo.getAll(filters);
  }

  async layTheoMa(ma) {
    return await repo.getById(ma);
  }

  async layTheoDonHang(maDonHang) {
    return await repo.getByDonHang(maDonHang);
  }

  async taoMoi(data) {
    return await repo.create(data);
  }
  
  async create(body) {
    // Validate order existence and eligibility: order must belong to customer and be delivered within 7 days
    try {
      const { data: orderRow, error: ordErr } = await supabase
        .from('donhang')
        .select('madonhang, makhachhang, trangthaidonhang, ngaygiaohang')
        .eq('madonhang', body.madonhang)
        .maybeSingle();
      if (ordErr) throw ordErr;
      if (!orderRow) {
        const e = new Error('Không tìm thấy đơn hàng tương ứng');
        e.status = 400;
        throw e;
      }

      if (Number(orderRow.makhachhang) !== Number(body.makhachhang)) {
        const e = new Error('Đơn hàng không thuộc về khách hàng này');
        e.status = 403;
        throw e;
      }

      const status = (orderRow.trangthaidonhang || '').toString().toUpperCase();
      if (status !== 'ĐÃ GIAO' && status !== 'DA GIAO' && status !== 'ĐÃ_GIAO' && status !== 'DA_GIAO') {
        const e = new Error('Chỉ có thể yêu cầu trả/hoàn tiền khi đơn đã được giao');
        e.status = 400;
        throw e;
      }

      // ngaygiaohang may be null in older DBs; if missing, reject to be safe
      const ngaygiaohang = orderRow.ngaygiaohang ? new Date(orderRow.ngaygiaohang) : null;
      if (!ngaygiaohang) {
        const e = new Error('Không có ngày giao cho đơn hàng; không thể yêu cầu trả hàng');
        e.status = 400;
        throw e;
      }

      const diffDays = Math.floor((Date.now() - ngaygiaohang.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        const e = new Error('Quá hạn trả hàng (hết 7 ngày kể từ ngày giao)');
        e.status = 400;
        throw e;
      }

      // --- Không cho trả nếu là sản phẩm khuyến mãi ---
      // 1. Lấy chi tiết sản phẩm để suy ra mã sản phẩm
      if (!body.machitietsanpham) {
        const e = new Error('Thiếu mã chi tiết sản phẩm (machitietsanpham)');
        e.status = 400;
        throw e;
      }
      const { data: variantRow, error: variantErr } = await supabase
        .from('chitietsanpham')
        .select('machitietsanpham, masanpham')
        .eq('machitietsanpham', body.machitietsanpham)
        .maybeSingle();
      if (variantErr) throw variantErr;
      if (!variantRow) {
        const e = new Error('Không tìm thấy chi tiết sản phẩm');
        e.status = 400;
        throw e;
      }

      // 2. Kiểm tra trong bảng khuyến mãi còn đang hiệu lực hay không.
      //    Quy ước: khuyến mãi hiệu lực nếu today nằm giữa ngaybatdau & ngayketthuc.
      //    Nếu logic khác (ví dụ có cột trạngthai), cần bổ sung điều kiện tương ứng trên Supabase.
      const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const { data: promoRows, error: promoErr } = await supabase
        .from('khuyenmai')
        .select('makhuyenmai, masanpham, ngaybatdau, ngayketthuc')
        .eq('masanpham', variantRow.masanpham)
        .lte('ngaybatdau', todayStr)
        .gte('ngayketthuc', todayStr);
      if (promoErr) throw promoErr;
      if (Array.isArray(promoRows) && promoRows.length) {
        const e = new Error('Sản phẩm khuyến mãi không áp dụng đổi/trả');
        e.status = 400;
        throw e;
      }

      const payload = {
        madonhang: body.madonhang,
        makhachhang: body.makhachhang,
        machitietsanpham: body.machitietsanpham,
        soluong: body.soluong,
        lydo: body.lydo,
        hinhanhloi: body.hinhanhloi ?? null,
        ngayyeucau: body.ngayyeucau ?? new Date().toISOString(),
        trangthai: STATUS.TRAHANG.CHO_DUYET,
        ghichu: body.ghichu ?? null
      };
      const created = await repo.create(payload);

      // Cập nhật trạng thái đơn gốc (tuỳ chọn chính sách) để dễ theo dõi
      try {
        await donhangRepo.update(body.madonhang, { trangthaidonhang: 'Đang xử lý đổi trả' });
      } catch (_) { /* ignore if fails */ }

      // Tự động tạo hoặc lấy chatbox và gửi thông báo hệ thống
      try {
        const { data: existingBoxes } = await supabase
          .from('chatbox')
          .select('*')
          .eq('makhachhang', body.makhachhang)
          .order('ngaytao', { ascending: false })
          .limit(1);
        let boxId = null;
        if (existingBoxes && existingBoxes.length) {
          boxId = existingBoxes[0].machatbox;
        } else {
          // tạo chatbox tối thiểu (yêu cầu manhanvien => chọn bất kỳ nhân viên đầu tiên)
          const { data: staffRow } = await supabase
            .from('taikhoannhanvien')
            .select('manhanvien')
            .order('manhanvien', { ascending: true })
            .limit(1);
          const staffId = staffRow && staffRow.length ? staffRow[0].manhanvien : null;
          const { data: newBox } = await supabase
            .from('chatbox')
            .insert([{ makhachhang: body.makhachhang, manhanvien: staffId, ngaytao: new Date().toISOString(), trangthai: 'Đang hoạt động' }])
            .select('*')
            .single();
          boxId = newBox.machatbox;
        }
        if (boxId) {
          await chatMsgRepo.create({
            machatbox: boxId,
            nguoigui: 'NV',
            noidung: `[SYSTEM] Shop đã nhận yêu cầu trả hàng #${created.matrahang}. Vui lòng chờ duyệt.`,
            thoigiangui: new Date().toISOString(),
            daxem: false
          });
        }
      } catch (e) {
        console.warn('Không gửi được tin nhắn hệ thống trả hàng:', e.message);
      }

      return created;
    } catch (e) {
      // rethrow known errors
      throw e;
    }
  }

  // --- Workflow actions ---
  async accept(id, diaChiGuiHang, huongDanDongGoi) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.TRAHANG.CHO_DUYET)) {
      const e = new Error('Trạng thái hiện tại không thể duyệt');
      e.status = 409; throw e;
    }
    const updated = await repo.update(id, {
  trangthai: STATUS.TRAHANG.DA_DUYET_CHO_GUI_HANG,
      ngayduyet: new Date().toISOString(),
      diachiguihang: diaChiGuiHang || null,
      huongdan_donggoi: huongDanDongGoi || null
    });
    await trahangLogRepo.log(id, 'ACCEPT', item.trangthai, STATUS.TRAHANG.DA_DUYET_CHO_GUI_HANG, `Địa chỉ: ${diaChiGuiHang||''}; Hướng dẫn: ${huongDanDongGoi||''}`, 'ADMIN');
    await this._systemMessage(
      item.makhachhang,
      `[SYSTEM] Yêu cầu trả hàng #${id} đã được duyệt. Gửi hàng về: ${diaChiGuiHang || 'Kho mặc định'}` +
      (huongDanDongGoi ? `\nHướng dẫn đóng gói: ${huongDanDongGoi}` : '')
    );
    return updated;
  }

  async reject(id, lyDo) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.TRAHANG.CHO_DUYET)) {
      const e = new Error('Trạng thái hiện tại không thể từ chối');
      e.status = 409; throw e;
    }
    const updated = await repo.update(id, {
  trangthai: STATUS.TRAHANG.TU_CHOI,
      ngayduyet: new Date().toISOString(),
      ghichu: lyDo || null,
      ly_do_tu_choi: lyDo || null
    });
    await trahangLogRepo.log(id, 'REJECT', item.trangthai, STATUS.TRAHANG.TU_CHOI, lyDo || '', 'ADMIN');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Yêu cầu trả hàng #${id} bị từ chối. Lý do: ${lyDo || 'Không rõ'}`);
    return updated;
  }

  async markReceived(id) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.TRAHANG.DA_DUYET_CHO_GUI_HANG)) {
      const e = new Error('Chỉ chuyển sang đã nhận khi chờ gửi hàng');
      e.status = 409; throw e;
    }
    const updated = await repo.update(id, {
  trangthai: STATUS.TRAHANG.DA_NHAN_HANG_CHO_KIEM_TRA,
      ngaynhanhang: new Date().toISOString()
    });
    await trahangLogRepo.log(id, 'MARK_RECEIVED', item.trangthai, STATUS.TRAHANG.DA_NHAN_HANG_CHO_KIEM_TRA, '', 'STAFF');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Shop đã nhận hàng cho phiếu #${id}, đang kiểm tra.`);
    return updated;
  }

  async markInvalid(id, ghiChu) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.TRAHANG.DA_NHAN_HANG_CHO_KIEM_TRA)) {
      const e = new Error('Chỉ đánh dấu không hợp lệ sau khi nhận hàng');
      e.status = 409; throw e;
    }
    const updated = await repo.update(id, {
  trangthai: STATUS.TRAHANG.KHONG_HOP_LE,
      ngaykiemtra: new Date().toISOString(),
      trangthaikiemtra: 'KHÔNG_HỢP_LỆ',
      ghichu: ghiChu || null,
      ly_do_khong_hop_le: ghiChu || null
    });
    await trahangLogRepo.log(id, 'MARK_INVALID', item.trangthai, STATUS.TRAHANG.KHONG_HOP_LE, ghiChu || '', 'STAFF');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Phiếu trả hàng #${id} không hợp lệ. ${ghiChu || ''}`);
    return updated;
  }

  async markValid(id) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.TRAHANG.DA_NHAN_HANG_CHO_KIEM_TRA)) {
      const e = new Error('Chỉ đánh dấu hợp lệ sau khi nhận hàng');
      e.status = 409; throw e;
    }
    const updated = await repo.update(id, {
  trangthai: STATUS.TRAHANG.DU_DIEU_KIEN_HOAN_TIEN,
      ngaykiemtra: new Date().toISOString(),
      trangthaikiemtra: 'ĐỦ ĐIỀU KIỆN'
    });
    await trahangLogRepo.log(id, 'MARK_VALID', item.trangthai, STATUS.TRAHANG.DU_DIEU_KIEN_HOAN_TIEN, '', 'STAFF');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Phiếu #${id} đủ điều kiện hoàn tiền.`);
    return updated;
  }

  async calculateRefund(id) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.TRAHANG.DU_DIEU_KIEN_HOAN_TIEN)) {
      const e = new Error('Chỉ tính tiền khi đủ điều kiện hoàn');
      e.status = 409; throw e;
    }
    // Lấy giá dòng đơn gốc theo madonhang + machitietsanpham
    const { data: detailRow, error: detailErr } = await supabase
      .from('chitietdonhang')
      .select('dongia')
      .eq('madonhang', item.maDonHang || item.madonhang)
      .eq('machitietsanpham', item.maChiTietSanPham || item.machitietsanpham)
      .maybeSingle();
    if (detailErr) throw detailErr;
    if (!detailRow) {
      const e = new Error('Không tìm thấy chi tiết đơn hàng để tính giá');
      e.status = 400; throw e;
    }
    const soTien = (Number(detailRow.dongia) || 0) * (item.soLuong || item.soluong || 0);
    const updated = await repo.update(id, { sotien_hoan: soTien });
    await trahangLogRepo.log(id, 'CALC_REFUND', item.trangthai, item.trangthai, `sotien_hoan=${soTien}`, 'SYSTEM');
    return updated;
  }

  async processRefund(id, phuongThuc = 'GATEWAY') {
    const item = await this.get(id);
  if (![this._norm(STATUS.TRAHANG.DU_DIEU_KIEN_HOAN_TIEN),'Dang hoan tien','Đang hoàn tiền'].includes(this._norm(item.trangthai))) {
      const e = new Error('Trạng thái không phù hợp để hoàn tiền');
      e.status = 409; throw e;
    }
    // Giả lập gateway: thành công luôn (nếu cần tích hợp thật, thay thế đoạn này)
    const updated = await repo.update(id, {
  trangthai: STATUS.TRAHANG.DA_HOAN_TIEN,
      phuongthuc_hoan: phuongThuc,
      ngayhoantien: new Date().toISOString()
    });
    await trahangLogRepo.log(id, 'REFUND', item.trangthai, STATUS.TRAHANG.DA_HOAN_TIEN, `method=${phuongThuc}`, 'ADMIN');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Đã hoàn tiền phiếu #${id} số tiền ${updated.sotien_hoan || 0}đ.`);
    // Trả trạng thái đơn về 'ĐÃ GIAO' nếu không còn phiếu mở khác (best-effort)
    try {
      const others = await repo.getByDonHang(item.maDonHang || item.madonhang);
      const stillOpen = others.filter(p => p.matrahang !== id && !['TỪ_CHỐI','KHÔNG_HỢP_LỆ','ĐÃ_HOÀN_TIỀN'].includes(p.trangthai));
      if (!stillOpen.length) {
        await donhangRepo.update(item.maDonHang || item.madonhang, { trangthaidonhang: 'ĐÃ GIAO' });
      }
    } catch(_) {}
    return updated;
  }

  async _systemMessage(makhachhang, text) {
    try {
      const { data: boxes } = await supabase
        .from('chatbox')
        .select('machatbox')
        .eq('makhachhang', makhachhang)
        .order('ngaytao', { ascending: false })
        .limit(1);
      let boxId = boxes && boxes.length ? boxes[0].machatbox : null;
      if (!boxId) {
        const { data: staffRow } = await supabase
          .from('taikhoannhanvien')
          .select('manhanvien')
          .order('manhanvien', { ascending: true })
          .limit(1);
        const staffId = staffRow && staffRow.length ? staffRow[0].manhanvien : null;
        const { data: newBox } = await supabase
          .from('chatbox')
          .insert([{ makhachhang, manhanvien: staffId, ngaytao: new Date().toISOString(), trangthai: 'Đang hoạt động' }])
          .select('*')
          .single();
        boxId = newBox.machatbox;
      }
      await chatMsgRepo.create({
        machatbox: boxId,
        nguoigui: 'NV',
        noidung: text,
        thoigiangui: new Date().toISOString(),
        daxem: false
      });
    } catch (e) {
      console.warn('SYSTEM MSG gagal:', e.message);
    }
  }

  async capNhat(ma, data) {
    return await repo.update(ma, data);
  }

  async xoa(ma) {
    return await repo.remove(ma);
  }

  // --- Compatibility wrappers (English method names used by controllers) ---
  async list(filters = {}) {
    return this.layTatCa(filters);
  }

  async get(id) {
    const item = await this.layTheoMa(id);
    if (!item) {
      const e = new Error('Không tìm thấy yêu cầu trả hàng');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async update(id, data) {
    const updated = await this.capNhat(id, data);
    if (!updated) {
      const e = new Error('Không tìm thấy yêu cầu để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const removed = await this.xoa(id);
    if (!removed) {
      const e = new Error('Không tìm thấy yêu cầu để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá yêu cầu trả hàng thành công' };
  }
}

module.exports = new TraHangService();
