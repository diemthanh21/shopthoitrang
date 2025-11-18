const chatBoxRepo = require('../repositories/chatbox.repository');
const chatMsgRepo = require('../repositories/noidungchat.repository');
const supabase = require('../../config/db');

// Helper: pick a default staff id (first staff row or env fallback)
async function getDefaultStaffId() {
  let staffId = null;
  const { data: staffList, error: staffErr } = await supabase
    .from('taikhoannhanvien')
    .select('manhanvien')
    .order('manhanvien', { ascending: true })
    .limit(1);
  if (staffErr) throw staffErr;
  staffId = staffList && staffList.length ? staffList[0].manhanvien : null;
  if (!staffId && process.env.DEFAULT_CHAT_STAFF_ID) {
    const parsed = parseInt(process.env.DEFAULT_CHAT_STAFF_ID, 10);
    if (!Number.isNaN(parsed)) staffId = parsed;
  }
  return staffId;
}

const ChatController = {
  // Admin: list all chat boxes with last message and unread counts
  async listChatBoxes(req, res) {
    try {
      const { data: boxes, error } = await supabase
        .from('chatbox')
        .select('*')
        .order('ngaytao', { ascending: false });
      if (error) throw error;

      // Auto-fix legacy rows missing manhanvien (NOT NULL constraint expectation)
      const legacy = boxes.filter(b => !b.manhanvien);
      if (legacy.length) {
        const staffId = await getDefaultStaffId();
        if (staffId) {
          const idsToFix = legacy.map(b => b.machatbox);
          const { error: updErr } = await supabase
            .from('chatbox')
            .update({ manhanvien: staffId })
            .in('machatbox', idsToFix);
          if (updErr) console.warn('[ChatController.listChatBoxes] cannot update legacy manhanvien:', updErr);
          else {
            // reflect changes locally
            for (const b of boxes) if (!b.manhanvien) b.manhanvien = staffId;
          }
        }
      }

      // For each chatbox, compute latest non-system message + unread (from customer)
      const ids = boxes.map(b => b.machatbox);
      let latestNonSystemByBox = new Map();
      let unreadByBox = new Map();
      // helper to detect simple system notifications
      const isSystemMessage = (m) => {
        if (!m) return false;
        try {
          const text = (m.noidung || '').toString();
          if (text.startsWith('[SYSTEM]')) return true;
          if (m.nguoigui && m.nguoigui.toString().toUpperCase() === 'SYSTEM') return true;
        } catch (_) {}
        return false;
      };

      if (ids.length) {
        const { data: msgs } = await supabase
          .from('noidungchat')
          .select('*')
          .in('machatbox', ids)
          .order('thoigiangui', { ascending: true });
        if (Array.isArray(msgs)) {
          for (const m of msgs) {
            // track unread from customers regardless of system flag
            if (m.nguoigui === 'KH' && !m.daxem) {
              unreadByBox.set(m.machatbox, (unreadByBox.get(m.machatbox) || 0) + 1);
            }
            // only consider non-system messages for the 'last message' shown in list
            if (!isSystemMessage(m)) {
              latestNonSystemByBox.set(m.machatbox, m);
            }
          }
        }
      }

      // Attach customer & staff names lightly (best effort)
      const customerIds = [...new Set(boxes.map(b => b.makhachhang).filter(Boolean))];
      const staffIds = [...new Set(boxes.map(b => b.manhanvien).filter(Boolean))];

      const [custRes, staffRes] = await Promise.all([
        customerIds.length
          ? supabase.from('taikhoankhachhang').select('makhachhang, hoten').in('makhachhang', customerIds)
          : Promise.resolve({ data: [] }),
        staffIds.length
          ? supabase.from('taikhoannhanvien').select('manhanvien, tendangnhap').in('manhanvien', staffIds)
          : Promise.resolve({ data: [] })
      ]);

      const custMap = new Map((custRes.data || []).map(c => [c.makhachhang, c]));
      const staffMap = new Map((staffRes.data || []).map(s => [s.manhanvien, s]));

      const result = boxes.map(b => ({
        ...b,
        khachHang: custMap.get(b.makhachhang) || null,
        nhanVien: staffMap.get(b.manhanvien) || null,
        // expose the last non-system message (if any) so frontend can show the real last message
        lastMessage: latestNonSystemByBox.get(b.machatbox) || null,
        unreadFromCustomer: unreadByBox.get(b.machatbox) || 0,
      }));

      res.json(result);
    } catch (err) {
      console.error('[ChatController.listChatBoxes] error:', err);
      res.status(500).json({ message: err.message || 'Lỗi khi lấy danh sách hội thoại' });
    }
  },

  // Customer: get or create a chatbox for current customer
  async startChat(req, res) {
    try {
      const user = req.user;
      const makhachhang = user?.maKhachHang || user?.makhachhang || user?.id;
      if (!makhachhang) return res.status(400).json({ message: 'Không xác định được khách hàng' });

      const { data: existing } = await supabase
        .from('chatbox')
        .select('*')
        .eq('makhachhang', makhachhang)
        .order('ngaytao', { ascending: false })
        .limit(1);

      // Pick a default staff to be responsible for the chat (NOT NULL constraint)
      const staffId = await getDefaultStaffId();

      if (!staffId) {
        return res.status(400).json({ message: 'Chưa có tài khoản nhân viên để tiếp nhận chat. Vui lòng tạo ít nhất 1 nhân viên hoặc đặt biến môi trường DEFAULT_CHAT_STAFF_ID.' });
      }

      if (existing && existing.length) {
        const box = existing[0];
        // Ensure manhanvien is set (in case legacy rows)
        if (!box.manhanvien) {
          const { data: updated, error: upErr } = await supabase
            .from('chatbox')
            .update({ manhanvien: staffId })
            .eq('machatbox', box.machatbox)
            .select('*')
            .single();
          if (upErr) throw upErr;
          return res.json(updated);
        }
        return res.json(box);
      }

      const { data, error } = await supabase
        .from('chatbox')
        .insert([{ makhachhang, manhanvien: staffId, ngaytao: new Date().toISOString(), trangthai: 'Đang hoạt động' }])
        .select('*')
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      console.error('[ChatController.startChat] error:', err);
      res.status(500).json({ message: err.message || 'Lỗi khi tạo hội thoại' });
    }
  },

  // Both: get messages by chatbox id (attach staff name per message)
  async getMessages(req, res) {
    try {
      const machatbox = req.params.machatbox;
      const list = await chatMsgRepo.getByChatBox(machatbox);

      // Attach staff info on messages
  const staffIds = [...new Set(list.map(m => m.maNhanVien).filter(Boolean))];
      let staffMap = new Map();
      if (staffIds.length) {
        const { data } = await supabase
          .from('taikhoannhanvien')
          .select('manhanvien, tendangnhap')
          .in('manhanvien', staffIds);
        if (Array.isArray(data)) staffMap = new Map(data.map(s => [s.manhanvien, s]));
      }
      const result = list.map(m => {
        const json = m.toJSON();
        return {
          ...json,
          nhanvien: json.manhanvien ? staffMap.get(json.manhanvien) || null : null,
        };
      });
      res.json(result);
    } catch (err) {
      console.error('[ChatController.getMessages] error:', err);
      res.status(500).json({ message: err.message || 'Lỗi khi lấy tin nhắn' });
    }
  },

  // Employee or Customer send message
  async sendMessage(req, res) {
    try {
      const { machatbox, noidung } = req.body;
      if (!machatbox || !noidung) return res.status(400).json({ message: 'Thiếu machatbox hoặc noidung' });
      const user = req.user || {};
      const role = (user.role || '').toString().toLowerCase();
      // Detect staff by role or by presence of staff id fields in token
      const possibleStaffIds = [
        user.maNhanVien, user.maNhanVien && parseInt(user.maNhanVien, 10),
        user.manhanvien, user.manhanvien && parseInt(user.manhanvien, 10),
        user.manhanvienId, user.manhanvienId && parseInt(user.manhanvienId, 10),
        user.ma_nhanvien, user.ma_nhanvien && parseInt(user.ma_nhanvien, 10),
        user.idNhanVien, user.idNhanVien && parseInt(user.idNhanVien, 10),
        user.id, user.id && parseInt(user.id, 10),
        // sometimes token contains a nested 'data' or 'user' object
        user.data && user.data.manhanvien, user.data && user.data.maNhanVien,
        user.user && user.user.manhanvien, user.user && user.user.maNhanVien
      ].filter(v => v !== undefined && v !== null);
      const staffIdFromToken = possibleStaffIds.length ? possibleStaffIds[0] : null;
      const isStaff = role === 'employee' || role === 'admin' || Boolean(staffIdFromToken);
      const payload = {
        machatbox,
        nguoigui: isStaff ? 'NV' : 'KH',
        noidung,
        thoigiangui: new Date().toISOString(),
        daxem: false,
      };
      if (isStaff) {
        // prefer numeric staff id
        let sid = staffIdFromToken;
        if (!sid && process.env.DEFAULT_CHAT_STAFF_ID) {
          const parsed = parseInt(process.env.DEFAULT_CHAT_STAFF_ID, 10);
          if (!Number.isNaN(parsed)) sid = parsed;
        }

        // Fallback: use the chatbox assigned staff if exists
        if (!sid) {
          try {
            const { data: box } = await supabase
              .from('chatbox')
              .select('machatbox, manhanvien')
              .eq('machatbox', machatbox)
              .maybeSingle();
            if (box) {
              if (box.manhanvien) {
                sid = box.manhanvien;
              } else {
                // Assign a default staff to this chatbox to satisfy NOT NULL
                const def = await getDefaultStaffId();
                if (def) {
                  const { data: updated } = await supabase
                    .from('chatbox')
                    .update({ manhanvien: def })
                    .eq('machatbox', machatbox)
                    .select('manhanvien')
                    .maybeSingle();
                  if (updated && updated.manhanvien) sid = updated.manhanvien;
                }
              }
            }
          } catch (_) { /* ignore and keep looking for sid */ }
        }

        if (!sid) {
          // Log the decoded user object to help map claim names in your environment.
          // This avoids logging tokens/secrets and is intended for short-term debugging.
          console.warn('[ChatController.sendMessage] staff sender detected but no staff id claim found in req.user:', JSON.stringify(user));
          return res.status(400).json({ message: 'Không xác định được mã nhân viên (NV) để gán cho tin nhắn. Hãy cấu hình DEFAULT_CHAT_STAFF_ID, hoặc đảm bảo chatbox có manhanvien, hoặc bổ sung claim manhanvien vào JWT.' });
        }
        payload.manhanvien = sid;
      }

      try {
        const item = await chatMsgRepo.create(payload);
        return res.status(201).json(item.toJSON());
      } catch (createErr) {
        const msg = (createErr && createErr.message) ? createErr.message : '';
        const missingCol = msg.includes("'manhanvien' column") || msg.includes('manhanvien') && msg.includes('schema cache');
        if (payload.manhanvien && missingCol) {
          // Fallback for environments where column hasn't been migrated yet
          console.warn('[ChatController.sendMessage] manhanvien column missing in noidungchat, retrying insert without it.');
          const { manhanvien, ...fallbackPayload } = payload;
          const item2 = await chatMsgRepo.create(fallbackPayload);
          return res.status(201).json(item2.toJSON());
        }
        throw createErr;
      }
    } catch (err) {
      console.error('[ChatController.sendMessage] error:', err);
      res.status(500).json({ message: err.message || 'Lỗi khi gửi tin nhắn' });
    }
  },

  // Send a standardized product card message
  async sendProductMessage(req, res) {
    try {
      const { machatbox, masanpham, tensanpham, hinhanh, giaban, kichco, mausac, soluong } = req.body || {};
      if (!machatbox || !masanpham || !tensanpham) {
        return res.status(400).json({ message: 'Thiếu tham số: machatbox, masanpham, tensanpham là bắt buộc' });
      }

      const user = req.user || {};
      const role = (user.role || '').toString().toLowerCase();
      const possibleStaffIds = [
        user.maNhanVien, user.maNhanVien && parseInt(user.maNhanVien, 10),
        user.manhanvien, user.manhanvien && parseInt(user.manhanvien, 10),
        user.manhanvienId, user.manhanvienId && parseInt(user.manhanvienId, 10),
        user.ma_nhanvien, user.ma_nhanvien && parseInt(user.ma_nhanvien, 10),
        user.idNhanVien, user.idNhanVien && parseInt(user.idNhanVien, 10),
        user.id, user.id && parseInt(user.id, 10),
        user.data && user.data.manhanvien, user.data && user.data.maNhanVien,
        user.user && user.user.manhanvien, user.user && user.user.maNhanVien
      ].filter(v => v !== undefined && v !== null);
      const staffIdFromToken = possibleStaffIds.length ? possibleStaffIds[0] : null;
      const isStaff = role === 'employee' || role === 'admin' || Boolean(staffIdFromToken);

      const basePayload = {
        machatbox,
        nguoigui: isStaff ? 'NV' : 'KH',
        thoigiangui: new Date().toISOString(),
        daxem: false,
      };

      // Build product snapshot object
      const snapshot = {
        masanpham,
        tensanpham,
        hinhanh: hinhanh || null,
        giaban: typeof giaban === 'number' ? giaban : (giaban ? Number(giaban) : null),
        kichco: kichco || null,
        mausac: mausac || null,
        soluong: (typeof soluong === 'number') ? soluong : (soluong ? Number(soluong) : 1),
      };

      // Prefer structured columns if exist; fallback to JSON string in noidung
      let payload = { ...basePayload, message_type: 'product', product_snapshot: snapshot, noidung: JSON.stringify({ type: 'product', product: snapshot }) };

      if (isStaff) {
        let sid = staffIdFromToken;
        if (!sid && process.env.DEFAULT_CHAT_STAFF_ID) {
          const parsed = parseInt(process.env.DEFAULT_CHAT_STAFF_ID, 10);
          if (!Number.isNaN(parsed)) sid = parsed;
        }
        if (!sid) {
          try {
            const { data: box } = await supabase
              .from('chatbox')
              .select('machatbox, manhanvien')
              .eq('machatbox', machatbox)
              .maybeSingle();
            if (box) {
              if (box.manhanvien) sid = box.manhanvien;
              else {
                const def = await getDefaultStaffId();
                if (def) {
                  const { data: updated } = await supabase
                    .from('chatbox')
                    .update({ manhanvien: def })
                    .eq('machatbox', machatbox)
                    .select('manhanvien')
                    .maybeSingle();
                  if (updated && updated.manhanvien) sid = updated.manhanvien;
                }
              }
            }
          } catch (_) {}
        }
        if (!sid) {
          return res.status(400).json({ message: 'Không xác định được mã nhân viên (NV) để gán cho tin nhắn sản phẩm.' });
        }
        payload.manhanvien = sid;
      }

      try {
        // Try insert with extended columns first
        const item = await chatMsgRepo.create(payload);
        return res.status(201).json(item.toJSON());
      } catch (err1) {
        const msg = (err1 && err1.message) ? err1.message : '';
        const missingCols = msg.includes('message_type') || msg.includes('product_snapshot') || msg.includes('schema cache');
        if (missingCols) {
          // Retry with only noidung JSON string (compatible with old schema)
          const fallback = { ...basePayload, noidung: JSON.stringify({ type: 'product', product: snapshot }) };
          if (isStaff && payload.manhanvien) fallback.manhanvien = payload.manhanvien;
          const item2 = await chatMsgRepo.create(fallback);
          return res.status(201).json(item2.toJSON());
        }
        throw err1;
      }
    } catch (err) {
      console.error('[ChatController.sendProductMessage] error:', err);
      res.status(500).json({ message: err.message || 'Lỗi khi gửi tin nhắn sản phẩm' });
    }
  },

  async markRead(req, res) {
    try {
      const { id } = req.params; // machat
      const updated = await chatMsgRepo.update(id, { daxem: true });
      if (!updated) return res.status(404).json({ message: 'Không tìm thấy tin' });
      res.json(updated.toJSON());
    } catch (err) {
      console.error('[ChatController.markRead] error:', err);
      res.status(500).json({ message: err.message || 'Lỗi khi cập nhật' });
    }
  }
  ,
  // Mark all messages in a chatbox as read (bulk) – typically when opening the chat UI.
  async markAllRead(req, res) {
    try {
      const { machatbox } = req.params;
      if (!machatbox) return res.status(400).json({ message: 'Thiếu machatbox' });
      // Bulk update only the unread ones
      const { data, error } = await supabase
        .from('noidungchat')
        .update({ daxem: true })
        .eq('machatbox', machatbox)
        .eq('daxem', false)
        .select('machat');
      if (error) throw error;
      res.json({ updated: (data || []).length });
    } catch (err) {
      console.error('[ChatController.markAllRead] error:', err);
      res.status(500).json({ message: err.message || 'Lỗi khi đánh dấu đã xem tất cả' });
    }
  }
};

module.exports = ChatController;
