const db = require('../../config/db');

module.exports = {
  /**
   * Tạo log thông báo chốt ca
   */
  async createChotCaLog(maChotCa, maNhanVien, action, note, actorType = 'NHANVIEN') {
    try {
      const { data, error } = await db
        .from('chotca_log')
        .insert({
          machotca: maChotCa,
          action: action, // 'CREATED', 'APPROVED', 'REJECTED'
          note: note,
          actor_type: actorType, // 'NHANVIEN' khi tạo, 'ADMIN' khi duyệt/từ chối
          actor_id: maNhanVien,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[SystemLog] createChotCaLog error', e?.message || e);
      throw e;
    }
  },

  /**
   * Tạo log thông báo phiếu đặt hàng
   */
  async createPhieuDatHangLog(maPhieuDatHang, actorId, action, note, actorType = 'NHANVIEN') {
    try {
      const { data, error } = await db
        .from('phieudathang_log')
        .insert({
          maphieudathang: maPhieuDatHang,
          action: action, // 'CREATED', 'APPROVED', 'REJECTED'
          note: note,
          actor_type: actorType, // 'NHANVIEN' khi tạo, 'ADMIN' khi duyệt/từ chối
          actor_id: actorId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[SystemLog] createPhieuDatHangLog error', e?.message || e);
      throw e;
    }
  },

  /**
   * Tạo log thông báo phiếu nhập kho
   */
  async createPhieuNhapKhoLog(maPhieuNhapKho, actorId, action, note, actorType = 'NHANVIEN') {
    try {
      const { data, error } = await db
        .from('phieunhapkho_log')
        .insert({
          maphieunhap: maPhieuNhapKho, // Sửa từ maphieunhapkho thành maphieunhap
          action: action, // 'CREATED', 'APPROVED', 'REJECTED'
          note: note,
          actor_type: actorType, // 'NHANVIEN' khi tạo, 'ADMIN' khi duyệt/từ chối
          actor_id: actorId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[SystemLog] createPhieuNhapKhoLog error', e?.message || e);
      throw e;
    }
  },

  async list(req, res) {
    try {
      const limit = parseInt(req.query.limit || '100', 10);
      const userId = req.query.userId; // Lấy userId để check đã đọc
      
      // Fetch doihang_log
      const { data: doihangRows } = await db
        .from('doihang_log')
        .select("madoihang, action, from_status, to_status, note, actor_type, actor_id, created_at")
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: trahangRows } = await db
        .from('trahang_log')
        .select("matrahang, action, from_status, to_status, note, actor_type, actor_id, created_at")
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: chotcaRows } = await db
        .from('chotca_log')
        .select("machotca, action, note, actor_type, actor_id, created_at")
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: phieudathangRows } = await db
        .from('phieudathang_log')
        .select("maphieudathang, action, note, actor_type, actor_id, created_at")
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: phieunhapkhoRows } = await db
        .from('phieunhapkho_log')
        .select("maphieunhap, action, note, actor_type, actor_id, created_at") // Sửa từ maphieunhapkho thành maphieunhap
        .order('created_at', { ascending: false })
        .limit(limit);

      // Lấy danh sách thông báo đã xem của user
      let readNotifications = [];
      if (userId) {
        const { data: readData } = await db
          .from('thongbao_daxem')
          .select('entity, entity_id, action')
          .eq('manhanvien', userId);
        readNotifications = readData || [];
      }

      // Normalize and merge
      const normalized = [];
      (doihangRows || []).forEach(r => normalized.push({
        entity: 'DOIHANG',
        entity_id: r.madoihang,
        action: r.action,
        from_status: r.from_status,
        to_status: r.to_status,
        note: r.note,
        actor_type: r.actor_type,
        actor_id: r.actor_id,
        created_at: r.created_at,
        is_read: readNotifications.some(rn => 
          rn.entity === 'DOIHANG' && 
          rn.entity_id === r.madoihang && 
          rn.action === r.action
        )
      }));

      (trahangRows || []).forEach(r => normalized.push({
        entity: 'TRAHANG',
        entity_id: r.matrahang,
        action: r.action,
        from_status: r.from_status,
        to_status: r.to_status,
        note: r.note,
        actor_type: r.actor_type,
        actor_id: r.actor_id,
        created_at: r.created_at,
        is_read: readNotifications.some(rn => 
          rn.entity === 'TRAHANG' && 
          rn.entity_id === r.matrahang && 
          rn.action === r.action
        )
      }));

      (chotcaRows || []).forEach(r => normalized.push({
        entity: 'CHOTCA',
        entity_id: r.machotca,
        action: r.action,
        from_status: null,
        to_status: null,
        note: r.note,
        actor_type: r.actor_type,
        actor_id: r.actor_id,
        created_at: r.created_at,
        is_read: readNotifications.some(rn => 
          rn.entity === 'CHOTCA' && 
          rn.entity_id === r.machotca && 
          rn.action === r.action
        )
      }));

      (phieudathangRows || []).forEach(r => normalized.push({
        entity: 'PHIEUDATHANG',
        entity_id: r.maphieudathang,
        action: r.action,
        from_status: null,
        to_status: null,
        note: r.note,
        actor_type: r.actor_type,
        actor_id: r.actor_id,
        created_at: r.created_at,
        is_read: readNotifications.some(rn => 
          rn.entity === 'PHIEUDATHANG' && 
          rn.entity_id === r.maphieudathang && 
          rn.action === r.action
        )
      }));

      (phieunhapkhoRows || []).forEach(r => normalized.push({
        entity: 'PHIEUNHAPKHO',
        entity_id: r.maphieunhap, // Sửa từ maphieunhapkho thành maphieunhap
        action: r.action,
        from_status: null,
        to_status: null,
        note: r.note,
        actor_type: r.actor_type,
        actor_id: r.actor_id,
        created_at: r.created_at,
        is_read: readNotifications.some(rn => 
          rn.entity === 'PHIEUNHAPKHO' && 
          rn.entity_id === r.maphieunhap && 
          rn.action === r.action
        )
      }));

      // Sort by created_at desc and slice to limit
      normalized.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

      res.json(normalized.slice(0, limit));
    } catch (e) {
      console.error('[SystemLog] list error', e?.message || e);
      res.status(500).json({ message: e.message || 'Lỗi server' });
    }
  },

  /**
   * Đánh dấu thông báo đã đọc
   */
  async markAsRead(req, res) {
    try {
      const { manhanvien, entity, entity_id, action } = req.body;
      
      if (!manhanvien || !entity || !entity_id || !action) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
      }

      const { data, error } = await db
        .from('thongbao_daxem')
        .upsert({
          manhanvien: parseInt(manhanvien),
          entity,
          entity_id: parseInt(entity_id),
          action,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'manhanvien,entity,entity_id,action'
        })
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, data });
    } catch (e) {
      console.error('[SystemLog] markAsRead error', e?.message || e);
      res.status(500).json({ message: e.message || 'Lỗi server' });
    }
  }
};
