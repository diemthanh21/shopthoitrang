const repo = require('../repositories/doihang.repository');
const supabase = require('../../config/db');
const donhangRepo = require('../repositories/donhang.repository');
const chatMsgRepo = require('../repositories/noidungchat.repository');
const STATUS = require('../constants/status');
const doihangLogRepo = require('../repositories/doihanglog.repository');

class DoiHangService {
  _norm(s){ return (s||'').toString().trim().toUpperCase().replace(/\s+/g,'_'); }
  async list(filters = {}) {
    const rows = await repo.getAll(filters);
    await this._attachVariantMeta(rows);
    return rows;
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy yêu cầu đổi hàng');
      e.status = 404;
      throw e;
    }
    await this._attachVariantMeta([item]);
    return item;
  }

  async getByCustomer(makhachhang) {
    return repo.getByCustomer(makhachhang);
  }

  async create(body) {
    const required = ['madonhang', 'makhachhang', 'machitietsanphamcu', 'machitietsanphammoi', 'soluong', 'lydo'];
    for (const key of required) {
      if (!body[key]) {
        const e = new Error(`Thiếu thông tin bắt buộc: ${key}`);
        e.status = 400;
        throw e;
      }
    }
    // Validate order: belongs to customer, delivered, within 7 days
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
      const e = new Error('Chỉ có thể yêu cầu đổi hàng khi đơn đã được giao');
      e.status = 400;
      throw e;
    }
    const ngaygiaohang = orderRow.ngaygiaohang ? new Date(orderRow.ngaygiaohang) : null;
    if (!ngaygiaohang) {
      const e = new Error('Không có ngày giao cho đơn hàng; không thể yêu cầu đổi hàng');
      e.status = 400;
      throw e;
    }
    const diffDays = Math.floor((Date.now() - ngaygiaohang.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      const e = new Error('Quá hạn đổi hàng (hết 7 ngày kể từ ngày giao)');
      e.status = 400;
      throw e;
    }

    // Block exchange if the original product (machitietsanphamcu) is a promotional product
    const { data: variantOld, error: varErr } = await supabase
      .from('chitietsanpham')
      .select('machitietsanpham, masanpham')
      .eq('machitietsanpham', body.machitietsanphamcu)
      .maybeSingle();
    if (varErr) throw varErr;
    if (!variantOld) {
      const e = new Error('Không tìm thấy chi tiết sản phẩm cũ');
      e.status = 400;
      throw e;
    }
    
    // Validate that new variant belongs to the same product (same-product exchange only)
    const { data: variantNew, error: varErrNew } = await supabase
      .from('chitietsanpham')
      .select('machitietsanpham, masanpham')
      .eq('machitietsanpham', body.machitietsanphammoi)
      .maybeSingle();
    if (varErrNew) throw varErrNew;
    if (!variantNew) {
      const e = new Error('Không tìm thấy chi tiết sản phẩm mới');
      e.status = 400;
      throw e;
    }
    if (variantOld.masanpham !== variantNew.masanpham) {
      const e = new Error('Chỉ được đổi sang biến thể khác của cùng sản phẩm (ví dụ: đổi size hoặc màu sắc)');
      e.status = 400;
      throw e;
    }
    
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: promoRows, error: promoErr } = await supabase
      .from('khuyenmai')
      .select('makhuyenmai, masanpham, ngaybatdau, ngayketthuc')
      .eq('masanpham', variantOld.masanpham)
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
      machitietsanphamcu: body.machitietsanphamcu,
      machitietsanphammoi: body.machitietsanphammoi,
      soluong: body.soluong,
      lydo: body.lydo,
      ngayyeucau: body.ngayyeucau ?? new Date().toISOString(),
      trangthai: STATUS.DOIHANG.CHO_DUYET,
      ghichu: body.ghichu ?? null,
    };
    const created = await repo.create(payload);

    // Cập nhật đơn gốc để dễ theo dõi
    try { await donhangRepo.update(body.madonhang, { trangthaidonhang: 'Đang xử lý đổi trả' }); } catch (_) {}

    // Gửi system chat
    await this._systemMessage(body.makhachhang, `[SYSTEM] Shop đã nhận yêu cầu đổi hàng #${created.madoihang}. Vui lòng chờ duyệt.`);

    return created;
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy yêu cầu để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy yêu cầu để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá yêu cầu đổi hàng thành công' };
  }

  // --- Workflow actions ---
  async accept(id, diaChiGuiHang, huongDanDongGoi) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.DOIHANG.CHO_DUYET)) { const e = new Error('Trạng thái hiện tại không thể duyệt'); e.status=409; throw e; }
  const updated = await repo.update(id, { trangthai: STATUS.DOIHANG.DA_DUYET_CHO_GUI_HANG_CU, ngayduyet: new Date().toISOString(), diachiguihang: diaChiGuiHang || null, huongdan_donggoi: huongDanDongGoi || null });
  await doihangLogRepo.log(id, 'ACCEPT', item.trangthai, STATUS.DOIHANG.DA_DUYET_CHO_GUI_HANG_CU, `Địa chỉ: ${diaChiGuiHang||''}; Hướng dẫn: ${huongDanDongGoi||''}`, 'ADMIN');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Yêu cầu đổi #${id} đã được duyệt. Gửi hàng cũ về: ${diaChiGuiHang || 'Kho mặc định'}` + (huongDanDongGoi? `\nHướng dẫn: ${huongDanDongGoi}`:'') );
    return updated;
  }

  async reject(id, lyDo) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.DOIHANG.CHO_DUYET)) { const e = new Error('Trạng thái hiện tại không thể từ chối'); e.status=409; throw e; }
  const updated = await repo.update(id, { trangthai: STATUS.DOIHANG.TU_CHOI, ngayduyet: new Date().toISOString(), ghichu: lyDo || null });
  await doihangLogRepo.log(id, 'REJECT', item.trangthai, STATUS.DOIHANG.TU_CHOI, lyDo || '', 'ADMIN');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Yêu cầu đổi #${id} bị từ chối. Lý do: ${lyDo || 'Không rõ'}`);
    return updated;
  }

  async markReceivedOld(id) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.DOIHANG.DA_DUYET_CHO_GUI_HANG_CU)) { const e = new Error('Chỉ xác nhận nhận hàng cũ ở trạng thái chờ gửi'); e.status=409; throw e; }
  const updated = await repo.update(id, { trangthai: STATUS.DOIHANG.DA_NHAN_HANG_CU_CHO_KIEM_TRA, ngaynhanhangcu: new Date().toISOString() });
  await doihangLogRepo.log(id, 'MARK_RECEIVED_OLD', item.trangthai, STATUS.DOIHANG.DA_NHAN_HANG_CU_CHO_KIEM_TRA, '', 'STAFF');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Shop đã nhận hàng cũ cho phiếu đổi #${id}, đang kiểm tra.`);
    return updated;
  }

  async markInvalid(id, ghiChu) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.DOIHANG.DA_NHAN_HANG_CU_CHO_KIEM_TRA)) { const e = new Error('Chỉ đánh dấu không hợp lệ sau khi nhận hàng'); e.status=409; throw e; }
  const updated = await repo.update(id, { trangthai: STATUS.DOIHANG.KHONG_HOP_LE, ngaykiemtra: new Date().toISOString(), trangthaikiemtra: 'KHÔNG_HỢP_LỆ', ghichu: ghiChu || null });
  await doihangLogRepo.log(id, 'MARK_INVALID', item.trangthai, STATUS.DOIHANG.KHONG_HOP_LE, ghiChu || '', 'STAFF');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Phiếu đổi #${id} không hợp lệ. ${ghiChu||''}`);
    return updated;
  }

  async markValid(id) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.DOIHANG.DA_NHAN_HANG_CU_CHO_KIEM_TRA)) { const e = new Error('Chỉ đánh dấu hợp lệ sau khi nhận hàng'); e.status=409; throw e; }
  const updated = await repo.update(id, { trangthai: STATUS.DOIHANG.CHO_TAO_DON_MOI, ngaykiemtra: new Date().toISOString(), trangthaikiemtra: 'Hợp lệ' });
  await doihangLogRepo.log(id, 'MARK_VALID', item.trangthai, STATUS.DOIHANG.CHO_TAO_DON_MOI, '', 'STAFF');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Phiếu đổi #${id} hợp lệ, sẽ tạo đơn mới để giao hàng thay thế.`);
    return updated;
  }

  async createNewOrder(id) {
    const item = await this.get(id);
  if (this._norm(item.trangthai) !== this._norm(STATUS.DOIHANG.CHO_TAO_DON_MOI)) { const e = new Error('Chưa thể tạo đơn mới - Phiếu chưa được kiểm tra hợp lệ'); e.status=409; throw e; }
    // Lấy giá từ đơn hàng gốc (vì cùng sản phẩm nên giá giống nhau)
    const { data: line } = await supabase
      .from('chitietdonhang')
      .select('dongia')
      .eq('madonhang', item.madonhang)
      .eq('machitietsanpham', item.machitietsanphamcu)
      .maybeSingle();
    const dongia = line?.dongia || 0;

    // Tạo đơn hàng mới
    const newOrderPayload = {
      makhachhang: item.makhachhang,
      ngaydathang: new Date().toISOString(),
      trangthaidonhang: 'Đang giao',
    };
    const newOrder = await donhangRepo.create(newOrderPayload);
    
    // Thêm chi tiết đơn với giá giống đơn cũ
    await supabase.from('chitietdonhang').insert([{ 
      madonhang: newOrder.madonhang, 
      machitietsanpham: item.machitietsanphammoi, 
      soluong: item.soluong, 
      dongia: dongia 
    }]);

  const updated = await repo.update(id, { madonhangmoi: newOrder.madonhang, ngaytaodonmoi: new Date().toISOString(), trangthai: STATUS.DOIHANG.DANG_GIAO_HANG_MOI });
  await doihangLogRepo.log(id, 'CREATE_NEW_ORDER', item.trangthai, STATUS.DOIHANG.DANG_GIAO_HANG_MOI, `madonhangmoi=${newOrder.madonhang}`, 'ADMIN');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Đã tạo đơn đổi mới #${newOrder.madonhang} cho phiếu #${id}.`);
    return updated;
  }

  async markExchangeComplete(id) {
    const item = await this.get(id);
  const updated = await repo.update(id, { trangthai: STATUS.DOIHANG.DA_DOI_XONG });
  await doihangLogRepo.log(id, 'COMPLETE', item.trangthai, STATUS.DOIHANG.DA_DOI_XONG, '', 'SYSTEM');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Phiếu đổi #${id} đã hoàn tất.`);
    return updated;
  }

  /**
   * Đồng bộ hoàn tất tự động dựa vào trạng thái đơn hàng mới.
   * Chỉ thực hiện khi phiếu đang ở trạng thái ĐA_TAO_DON_MOI_DANG_GIAO và đơn mới đã giao.
   * Không ném lỗi nếu điều kiện chưa thỏa – trả về object hiện tại.
   */
  async syncComplete(id) {
    const item = await this.get(id);
    if (item.trangthai !== STATUS.DOIHANG.DANG_GIAO_HANG_MOI) return item; // nothing to do
    if (!item.madonhangmoi) return item;
    try {
      const order = await donhangRepo.getById(item.madonhangmoi);
      if (!order) return item;
      const st = this._norm(order.trangthaidonhang || '');
      const delivered = st.includes('DA_GIAO') || st.includes('GIAO_XONG') || st === 'HOAN_THANH';
      if (!delivered) return item;
      const updated = await repo.update(id, { trangthai: STATUS.DOIHANG.DA_DOI_XONG, ngayhoantat: new Date().toISOString() });
      await doihangLogRepo.log(id, 'AUTO_COMPLETE', item.trangthai, STATUS.DOIHANG.DA_DOI_XONG, 'Đơn mới đã giao, tự động hoàn tất', 'SYSTEM');
      await this._systemMessage(item.makhachhang, `[SYSTEM] Phiếu đổi #${id} đã tự động hoàn tất sau khi đơn mới giao thành công.`);
      return updated;
    } catch (_) {
      return item; // silent
    }
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
      await chatMsgRepo.create({ machatbox: boxId, nguoigui: 'NV', noidung: text, thoigiangui: new Date().toISOString(), daxem: false });
    } catch (_) {}
  }

  async _attachVariantMeta(records) {
    const list = Array.isArray(records) ? records.filter(Boolean) : [];
    if (!list.length) return list;
    const variantIds = Array.from(new Set(list.flatMap((item) => [
      item.machitietsanphamcu,
      item.machitietsanphammoi,
    ]).filter(Boolean)));
    if (!variantIds.length) return list;
    const { data: variants, error: variantErr } = await supabase
      .from('chitietsanpham')
      .select('machitietsanpham, masanpham, kichthuoc, mausac, chatlieu, mota, giaban')
      .in('machitietsanpham', variantIds);
    if (variantErr) throw variantErr;
    const variantMap = {};
    (variants || []).forEach((v) => { variantMap[v.machitietsanpham] = v; });

    const productIds = Array.from(new Set((variants || [])
      .map((v) => v.masanpham)
      .filter(Boolean)));
    let productMap = {};
    if (productIds.length) {
      const { data: products, error: productErr } = await supabase
        .from('sanpham')
        .select('masanpham, tensanpham')
        .in('masanpham', productIds);
      if (productErr) throw productErr;
      productMap = {};
      (products || []).forEach((p) => { productMap[p.masanpham] = p; });
    }

    list.forEach((item) => {
      const oldVariant = variantMap[item.machitietsanphamcu] || null;
      const newVariant = variantMap[item.machitietsanphammoi] || null;
      item.variantCu = oldVariant ? {
        ...oldVariant,
        tensanpham: productMap[oldVariant.masanpham]?.tensanpham || null,
      } : null;
      item.variantMoi = newVariant ? {
        ...newVariant,
        tensanpham: productMap[newVariant.masanpham]?.tensanpham || null,
      } : null;
    });
    return list;
  }
}

module.exports = new DoiHangService();
