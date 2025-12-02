const supabase = require('../../config/db');

const TABLE = 'thethanhvien_point_ledger';

const PointLedgerRepository = {
  async create(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findPendingByOrder(orderId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('madonhang', orderId)
      .eq('status', 'PENDING');
    if (error) throw error;
    return data || [];
  },

  async findPendingDue(limitIso) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('status', 'PENDING')
      .lte('available_at', limitIso);
    if (error) throw error;
    return data || [];
  },
};

module.exports = PointLedgerRepository;
