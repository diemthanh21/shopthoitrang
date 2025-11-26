const supabase = require('../../config/db');

const TABLE = 'trahang_refund_pending';

const TraHangRefundPendingRepository = {
  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').maybeSingle();
    if (error) throw error;
    return data || null;
  },
  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || null;
  },
  async getByMatrahang(matrahang) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('matrahang', matrahang).order('created_at', { ascending: false }).limit(1);
    if (error) throw error;
    return Array.isArray(data) && data.length ? data[0] : null;
  },
  async getByExternalTxn(external_txn_id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('external_txn_id', external_txn_id).maybeSingle();
    if (error) throw error;
    return data || null;
  },
  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    return data || null;
  }
};

module.exports = TraHangRefundPendingRepository;