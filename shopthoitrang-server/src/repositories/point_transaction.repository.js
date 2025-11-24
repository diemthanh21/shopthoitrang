const supabase = require('../../config/db');
const TABLE = 'thethanhvien_point_transactions';
const LEGACY_TABLE = 'thethanhvien_point_ledger';

function isMissingV2Table(error) {
  return error && error.code === 'PGRST205' && /thethanhvien_point_transactions/i.test(error.message || '');
}

function mapToLegacyFields(fields = {}) {
  const mapped = { ...fields };
  if ('approved_at' in mapped) {
    mapped.released_at = mapped.approved_at;
    delete mapped.approved_at;
  }
  // legacy table doesn't support metadata; ignore silently
  if ('metadata' in mapped) {
    delete mapped.metadata;
  }
  return mapped;
}

/**
 * Repository cho giao dịch điểm tích lũy
 */
const PointTransactionRepository = {
  /**
   * Tạo giao dịch điểm mới
   */
  async create(payload) {
    let { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*')
      .single();
    if (error && isMissingV2Table(error)) {
      const legacyPayload = mapToLegacyFields(payload);
      const res = await supabase
        .from(LEGACY_TABLE)
        .insert([legacyPayload])
        .select('*')
        .single();
      if (res.error) throw res.error;
      return res.data;
    }
    if (error) throw error;
    return data;
  },

  /**
   * Lấy tất cả giao dịch của một thẻ
   */
  async findByCard(mathe, options = {}) {
    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('mathe', mathe);
    
    if (options.type) {
      query = query.eq('type', options.type);
    }
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    query = query.order('created_at', { ascending: false });
    
    let { data, error } = await query;
    if (error && isMissingV2Table(error)) {
      // fallback
      let q2 = supabase.from(LEGACY_TABLE).select('*').eq('mathe', mathe);
      if (options.type) q2 = q2.eq('type', options.type);
      if (options.status) q2 = q2.eq('status', options.status);
      if (options.limit) q2 = q2.limit(options.limit);
      q2 = q2.order('created_at', { ascending: false });
      const r2 = await q2;
      if (r2.error) throw r2.error;
      return r2.data || [];
    }
    if (error) throw error;
    return data || [];
  },

  /**
   * Lấy tất cả giao dịch của khách hàng
   */
  async findByCustomer(makhachhang, options = {}) {
    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('makhachhang', makhachhang);
    
    if (options.type) {
      query = query.eq('type', options.type);
    }
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    query = query.order('created_at', { ascending: false });
    
    let { data, error } = await query;
    if (error && isMissingV2Table(error)) {
      // fallback
      let q2 = supabase.from(LEGACY_TABLE).select('*').eq('makhachhang', makhachhang);
      if (options.type) q2 = q2.eq('type', options.type);
      if (options.status) q2 = q2.eq('status', options.status);
      if (options.limit) q2 = q2.limit(options.limit);
      q2 = q2.order('created_at', { ascending: false });
      const r2 = await q2;
      if (r2.error) throw r2.error;
      return r2.data || [];
    }
    if (error) throw error;
    return data || [];
  },

  /**
   * Lấy giao dịch theo đơn hàng
   */
  async findByOrder(madonhang) {
    let { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('madonhang', madonhang)
      .order('created_at', { ascending: false });
    if (error && isMissingV2Table(error)) {
      const r2 = await supabase
        .from(LEGACY_TABLE)
        .select('*')
        .eq('madonhang', madonhang)
        .order('created_at', { ascending: false });
      if (r2.error) throw r2.error;
      return r2.data || [];
    }
    if (error) throw error;
    return data || [];
  },

  /**
   * Lấy giao dịch theo ID
   */
  async getById(id) {
    let { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error && isMissingV2Table(error)) {
      const r2 = await supabase
        .from(LEGACY_TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (r2.error) throw r2.error;
      return r2.data;
    }
    if (error) throw error;
    return data;
  },

  /**
   * Cập nhật giao dịch
   */
  async update(id, fields) {
    let { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error && isMissingV2Table(error)) {
      const legacyFields = mapToLegacyFields(fields);
      const r2 = await supabase
        .from(LEGACY_TABLE)
        .update(legacyFields)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (r2.error) throw r2.error;
      return r2.data;
    }
    if (error) throw error;
    return data;
  },

  /**
   * Lấy các giao dịch PENDING đã đủ 7 ngày
   */
  async findPendingDue(referenceDate) {
    let { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('status', 'PENDING')
      .lte('available_at', referenceDate)
      .order('available_at', { ascending: true });
    if (error && isMissingV2Table(error)) {
      const r2 = await supabase
        .from(LEGACY_TABLE)
        .select('*')
        .eq('status', 'PENDING')
        .lte('available_at', referenceDate)
        .order('available_at', { ascending: true });
      if (r2.error) throw r2.error;
      return r2.data || [];
    }
    if (error) throw error;
    return data || [];
  },

  /**
   * Lấy tổng điểm PENDING của khách hàng
   */
  async getTotalPendingPoints(makhachhang) {
    let { data, error } = await supabase
      .from(TABLE)
      .select('diem')
      .eq('makhachhang', makhachhang)
      .eq('status', 'PENDING')
      .eq('type', 'EARN');
    if (error && isMissingV2Table(error)) {
      const r2 = await supabase
        .from(LEGACY_TABLE)
        .select('diem')
        .eq('makhachhang', makhachhang)
        .eq('status', 'PENDING')
        .eq('type', 'EARN');
      if (r2.error) throw r2.error;
      const rows = r2.data || [];
      return rows.reduce((sum, row) => sum + Number(row.diem || 0), 0);
    }
    if (error) throw error;
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, row) => sum + Number(row.diem || 0), 0);
  },

  /**
   * Lấy lịch sử điểm (approved/cancelled) của khách hàng
   */
  async getPointHistory(makhachhang, options = {}) {
    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('makhachhang', makhachhang)
      .in('status', ['APPROVED', 'CANCELLED']);
    
    if (options.fromDate) {
      query = query.gte('created_at', options.fromDate);
    }
    if (options.toDate) {
      query = query.lte('created_at', options.toDate);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    query = query.order('created_at', { ascending: false });
    
    let { data, error } = await query;
    if (error && isMissingV2Table(error)) {
      let q2 = supabase
        .from(LEGACY_TABLE)
        .select('*')
        .eq('makhachhang', makhachhang)
        .in('status', ['APPROVED', 'CANCELLED']);
      if (options.fromDate) q2 = q2.gte('created_at', options.fromDate);
      if (options.toDate) q2 = q2.lte('created_at', options.toDate);
      if (options.limit) q2 = q2.limit(options.limit);
      q2 = q2.order('created_at', { ascending: false });
      const r2 = await q2;
      if (r2.error) throw r2.error;
      return r2.data || [];
    }
    if (error) throw error;
    return data || [];
  },

  /**
   * Hủy tất cả pending points của một đơn hàng
   */
  async cancelOrderPoints(madonhang) {
    let { data, error } = await supabase
      .from(TABLE)
      .update({ 
        status: 'CANCELLED',
        updated_at: new Date().toISOString()
      })
      .eq('madonhang', madonhang)
      .eq('status', 'PENDING')
      .select('*');
    if (error && isMissingV2Table(error)) {
      const r2 = await supabase
        .from(LEGACY_TABLE)
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .eq('madonhang', madonhang)
        .eq('status', 'PENDING')
        .select('*');
      if (r2.error) throw r2.error;
      return r2.data || [];
    }
    if (error) throw error;
    return data || [];
  },

  /**
   * Xóa giao dịch (chỉ dùng trong trường hợp đặc biệt)
   */
  async delete(id) {
    let { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error && isMissingV2Table(error)) {
      const r2 = await supabase
        .from(LEGACY_TABLE)
        .delete()
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (r2.error) throw r2.error;
      return r2.data;
    }
    if (error) throw error;
    return data;
  }
};

module.exports = PointTransactionRepository;
