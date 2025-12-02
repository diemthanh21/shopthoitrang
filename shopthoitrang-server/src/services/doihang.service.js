const repo = require('../repositories/doihang.repository');
const supabase = require('../../config/db');
const donhangRepo = require('../repositories/donhang.repository');
const chatMsgRepo = require('../repositories/noidungchat.repository');
const STATUS = require('../constants/status');
const doihangLogRepo = require('../repositories/doihanglog.repository');
const chitietRepo = require('../repositories/chitietdoihang.repository');

class DoiHangService {
  _norm(s){ return (s||'').toString().trim().toUpperCase().replace(/\s+/g,'_'); }
  async list(filters = {}) {
    let rows = await repo.getAll(filters);
    await this._attachOrderMeta(rows);
    if (filters.makhachhang) {
      const target = Number(filters.makhachhang);
      rows = rows.filter(
        (item) => Number(item.makhachhang) === target
      );
    }
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
    await this._attachOrderMeta([item]);
    await this._attachVariantMeta([item]);
    return item;
  }

  async getByCustomer(makhachhang) {
    const rows = await repo.getByCustomer(makhachhang);
    await this._attachOrderMeta(rows);
    await this._attachVariantMeta(rows);
    return rows;
  }

  async create(body) {
    const baseRequired = ['madonhang', 'makhachhang', 'lydo'];
    for (const key of baseRequired) {
      if (!body[key]) {
        const e = new Error(`Thiếu thông tin bắt buộc: ${key}`);
        e.status = 400;
        throw e;
      }
    }

    if (!Array.isArray(body.items) || !body.items.length) {
      const e = new Error('Thiếu danh sách sản phẩm đổi (items)');
      e.status = 400;
      throw e;
    }

    const normalizedItems = body.items.map((raw, idx) => {
      const machitietsanphamcu = Number(raw.machitietsanphamcu);
      const machitietsanphammoi =
        raw.machitietsanphammoi == null ? null : Number(raw.machitietsanphammoi);
      const soluong = Number(raw.soluong);
      let evidencePayload = raw.hinhanh ?? null;
      if (evidencePayload && typeof evidencePayload === 'object') {
        try {
          evidencePayload = JSON.stringify(evidencePayload);
        } catch (_) {
          evidencePayload = JSON.stringify(String(evidencePayload));
        }
      }
      if (!machitietsanphamcu || Number.isNaN(machitietsanphamcu)) {
        const e = new Error(`Thiếu biến thể cũ cho dòng #${idx + 1}`);
        e.status = 400;
        throw e;
      }
      if (!soluong || Number.isNaN(soluong) || soluong <= 0) {
        const e = new Error(`Số lượng không hợp lệ ở dòng #${idx + 1}`);
        e.status = 400;
        throw e;
      }
      if (machitietsanphammoi == null) {
        const e = new Error('Vui lòng chọn biến thể mới cho sản phẩm đổi');
        e.status = 400;
        throw e;
      }
      return {
        machitietsanphamcu,
        machitietsanphammoi,
        soluong,
        lydo: raw.lydo || null,
        hinhanh: evidencePayload,
      };
    });

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
    if (
      status !== 'ĐÃ GIAO' &&
      status !== 'DA GIAO' &&
      status !== 'ĐÃ_GIAO' &&
      status !== 'DA_GIAO'
    ) {
      const e = new Error('Chỉ có thể yêu cầu đổi hàng khi đơn đã giao');
      e.status = 400;
      throw e;
    }
    const ngaygiaohang = orderRow.ngaygiaohang ? new Date(orderRow.ngaygiaohang) : null;
    if (!ngaygiaohang) {
      const e = new Error('Đơn hàng chưa có ngày giao, không thể đổi');
      e.status = 400;
      throw e;
    }
    const diffDays = Math.floor((Date.now() - ngaygiaohang.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      const e = new Error('Quá hạn đổi hàng (chỉ trong 7 ngày sau giao)');
      e.status = 400;
      throw e;
    }

    const { data: orderDetails, error: detailErr } = await supabase
      .from('chitietdonhang')
      .select('machitietsanpham, soluong')
      .eq('madonhang', body.madonhang);
    if (detailErr) throw detailErr;
    if (!Array.isArray(orderDetails) || !orderDetails.length) {
      const e = new Error('Đơn hàng không có chi tiết để đối chiếu');
      e.status = 400;
      throw e;
    }
    const orderQtyMap = {};
    orderDetails.forEach((row) => {
      orderQtyMap[row.machitietsanpham] = Number(row.soluong) || 0;
    });
    const requestedQtyMap = {};
    normalizedItems.forEach((item) => {
      requestedQtyMap[item.machitietsanphamcu] =
        (requestedQtyMap[item.machitietsanphamcu] || 0) + item.soluong;
      const orderedQty = orderQtyMap[item.machitietsanphamcu] || 0;
      if (requestedQtyMap[item.machitietsanphamcu] > orderedQty) {
        const e = new Error(
          `Số lượng đổi vượt quá số lượng đã đặt cho biến thể ${item.machitietsanphamcu}`
        );
        e.status = 400;
        throw e;
      }
    });

    const variantIds = Array.from(
      new Set(
        normalizedItems
          .flatMap((item) => [item.machitietsanphamcu, item.machitietsanphammoi])
          .filter(Boolean)
      )
    );
    const { data: variantRows, error: variantErr } = await supabase
      .from('chitietsanpham')
      .select('machitietsanpham, masanpham')
      .in('machitietsanpham', variantIds);
    if (variantErr) throw variantErr;
    const variantMap = {};
    (variantRows || []).forEach((row) => {
      variantMap[row.machitietsanpham] = row;
    });

    const productSet = new Set();
    normalizedItems.forEach((item, idx) => {
      const oldVariant = variantMap[item.machitietsanphamcu];
      if (!oldVariant) {
        const e = new Error(`Không tìm thấy biến thể cũ ở dòng #${idx + 1}`);
        e.status = 400;
        throw e;
      }
      const newVariant = variantMap[item.machitietsanphammoi];
      if (!newVariant) {
        const e = new Error(`Không tìm thấy biến thể mới ở dòng #${idx + 1}`);
        e.status = 400;
        throw e;
      }
      if (oldVariant.masanpham !== newVariant.masanpham) {
        const e = new Error('Chỉ được đổi sang biến thể khác của cùng sản phẩm (màu/size)');
        e.status = 400;
        throw e;
      }
      productSet.add(oldVariant.masanpham);
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    if (productSet.size) {
      const { data: promoRows, error: promoErr } = await supabase
        .from('khuyenmai')
        .select('makhuyenmai, masanpham, ngaybatdau, ngayketthuc')
        .in('masanpham', Array.from(productSet))
        .lte('ngaybatdau', todayStr)
        .gte('ngayketthuc', todayStr);
      if (promoErr) throw promoErr;
      if (Array.isArray(promoRows) && promoRows.length) {
        const e = new Error('Sản phẩm khuyến mãi không áp dụng đổi/trả');
        e.status = 400;
        throw e;
      }
    }

    const payload = {
      madonhang: body.madonhang,
      lydo: body.lydo,
      ngayyeucau: body.ngayyeucau ?? new Date().toISOString(),
      trangthai: STATUS.DOIHANG.CHO_DUYET,
      diachiguihang: body.diachiguihang ?? null,
      huongdan_donggoi: body.huongdan_donggoi ?? null,
      voucher_code: body.voucher_code ?? null,
      voucher_amount: body.voucher_amount ?? null,
      manhanvien: body.manhanvien ?? null,
    };
    const created = await repo.create(payload);

    const detailRows = normalizedItems.map((item) => ({
      madoihang: created.madoihang,
      machitietsanphamcu: item.machitietsanphamcu,
      machitietsanphammoi: item.machitietsanphammoi,
      soluong: item.soluong,
      lydo: item.lydo,
      hinhanh: item.hinhanh || null,
    }));
    await chitietRepo.insertMany(detailRows);

    try {
      await donhangRepo.update(body.madonhang, {
        trangthaidonhang: 'Đang xử lý đổi trả',
      });
    } catch (_) {}



    return this.get(created.madoihang);
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
  const rejectionNote = lyDo || item.trangthaikiemtra || null;
  const updated = await repo.update(id, { trangthai: STATUS.DOIHANG.TU_CHOI, ngayduyet: new Date().toISOString(), trangthaikiemtra: rejectionNote });
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
  if (this._norm(item.trangthai) !== this._norm(STATUS.DOIHANG.DA_NHAN_HANG_CU_CHO_KIEM_TRA)) { const e = new Error('Chi danh dau khong hop le sau khi nhan hang'); e.status=409; throw e; }
  const reviewNote = ghiChu ? `KHONG_HOP_LE: ${ghiChu}` : 'KHONG_HOP_LE';
  const updated = await repo.update(id, { trangthai: STATUS.DOIHANG.KHONG_HOP_LE, ngaykiemtra: new Date().toISOString(), trangthaikiemtra: reviewNote });
  await doihangLogRepo.log(id, 'MARK_INVALID', item.trangthai, STATUS.DOIHANG.KHONG_HOP_LE, ghiChu || '', 'STAFF');
    await this._systemMessage(item.makhachhang, `[SYSTEM] Phiếu đổi #${id} không hợp lệ. ${ghiChu || ''}`);
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
    if (this._norm(item.trangthai) !== this._norm(STATUS.DOIHANG.CHO_TAO_DON_MOI)) {
      const e = new Error('Chưa thể tạo đơn mới - Phiếu chưa được kiểm tra hợp lệ');
      e.status = 409;
      throw e;
    }
    const details = item.items || item.chitietdoihang || [];
    if (!details.length) {
      const e = new Error('Phiếu đổi không có chi tiết để tạo đơn mới');
      e.status = 400;
      throw e;
    }

    const sourceVariantIds = Array.from(
      new Set(details.map((d) => d.machitietsanphamcu).filter(Boolean))
    );
    const { data: lineRows } = await supabase
      .from('chitietdonhang')
      .select('machitietsanpham, dongia')
      .eq('madonhang', item.madonhang)
      .in('machitietsanpham', sourceVariantIds);
    const priceMap = {};
    (lineRows || []).forEach((row) => {
      priceMap[row.machitietsanpham] = Number(row.dongia) || 0;
    });

    const newOrderPayload = {
      makhachhang: item.makhachhang,
      ngaydathang: new Date().toISOString(),
      trangthaidonhang: 'Đang giao',
    };
    const newOrder = await donhangRepo.create(newOrderPayload);
    const insertRows = details
      .filter((d) => d.machitietsanphammoi)
      .map((detail) => ({
        madonhang: newOrder.madonhang,
        machitietsanpham: detail.machitietsanphammoi,
        soluong: detail.soluong,
        dongia: priceMap[detail.machitietsanphamcu] || 0,
      }));
    if (insertRows.length) {
      await supabase.from('chitietdonhang').insert(insertRows);
    }

    const updated = await repo.update(id, {
      madonhangmoi: newOrder.madonhang,
      ngaytaodonmoi: new Date().toISOString(),
      trangthai: STATUS.DOIHANG.DANG_GIAO_HANG_MOI,
    });
    await doihangLogRepo.log(
      id,
      'CREATE_NEW_ORDER',
      item.trangthai,
      STATUS.DOIHANG.DANG_GIAO_HANG_MOI,
      `madonhangmoi=${newOrder.madonhang}`,
      'ADMIN'
    );
    await this._systemMessage(
      item.makhachhang,
      `[SYSTEM] Đã tạo đơn đổi mới #${newOrder.madonhang} cho phiếu #${id}.`
    );
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

  _primaryDetail(item) {
    const details = item?.items || item?.chitietdoihang || [];
    if (!details.length) {
      const e = new Error('Phiếu đổi không có chi tiết');
      e.status = 400;
      throw e;
    }
    return details[0];
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
    const allDetails = list.flatMap(
      (item) => item.items || item.chitietdoihang || []
    );
    if (!allDetails.length) return list;
    const variantIds = Array.from(
      new Set(
        allDetails
          .flatMap((detail) => [
            detail.machitietsanphamcu,
            detail.machitietsanphammoi,
          ])
          .filter(Boolean)
      )
    );
    if (!variantIds.length) return list;
    const { data: variants, error: variantErr } = await supabase
      .from('chitietsanpham')
      .select(
        'machitietsanpham, masanpham, mausac, chatlieu, mota, giaban, chitietsanpham_kichthuoc ( id, makichthuoc, so_luong, kichthuocs ( ten_kichthuoc ) )'
      )
      .in('machitietsanpham', variantIds);
    if (variantErr) throw variantErr;
    const variantMap = {};
    (variants || []).forEach((v) => {
      const sizeEntries = v.chitietsanpham_kichthuoc || [];
      const firstSize = sizeEntries.length
        ? sizeEntries.find((s) => (s?.so_luong ?? 0) > 0) || sizeEntries[0]
        : null;
      variantMap[v.machitietsanpham] = {
        machitietsanpham: v.machitietsanpham,
        masanpham: v.masanpham,
        mausac: v.mausac,
        chatlieu: v.chatlieu,
        mota: v.mota,
        giaban: v.giaban,
        kichthuoc: firstSize?.kichthuocs?.ten_kichthuoc || null,
        sizes: sizeEntries.map((entry) => ({
          id: entry.id,
          makichthuoc: entry.makichthuoc,
          ten_kichthuoc: entry.kichthuocs?.ten_kichthuoc || null,
          so_luong: entry.so_luong,
        })),
      };
    });

    const productIds = Array.from(
      new Set(
        (variants || []).map((v) => v.masanpham).filter(Boolean)
      )
    );
    let productMap = {};
    if (productIds.length) {
      const { data: products, error: productErr } = await supabase
        .from('sanpham')
        .select('masanpham, tensanpham')
        .in('masanpham', productIds);
      if (productErr) throw productErr;
      productMap = {};
      (products || []).forEach((p) => {
        productMap[p.masanpham] = p;
      });
    }

    allDetails.forEach((detail) => {
      const oldVariant = variantMap[detail.machitietsanphamcu] || null;
      const newVariant = variantMap[detail.machitietsanphammoi] || null;
      detail.variantCu = oldVariant
        ? {
            ...oldVariant,
            tensanpham: productMap[oldVariant.masanpham]?.tensanpham || null,
          }
        : null;
      detail.variantMoi = newVariant
        ? {
            ...newVariant,
            tensanpham: productMap[newVariant.masanpham]?.tensanpham || null,
          }
        : null;
    });
    return list;
  }

  async _attachOrderMeta(records) {
    const list = Array.isArray(records) ? records.filter(Boolean) : [];
    if (!list.length) return list;
    const orderIds = Array.from(
      new Set(list.map((item) => item.madonhang).filter(Boolean))
    );
    if (!orderIds.length) return list;
    const { data: orders, error } = await supabase
      .from('donhang')
      .select('madonhang, makhachhang, trangthaidonhang')
      .in('madonhang', orderIds);
    if (error) throw error;
    const orderMap = {};
    (orders || []).forEach((row) => {
      orderMap[row.madonhang] = row;
    });
    list.forEach((item) => {
      const meta = orderMap[item.madonhang];
      if (meta) {
        item.makhachhang = meta.makhachhang ?? item.makhachhang ?? null;
        item.orderStatus = meta.trangthaidonhang ?? item.orderStatus ?? null;
      }
    });
    return list;
  }
}

module.exports = new DoiHangService();





