const supabase = require('../../config/db');

const TABLE = 'membership_order_snapshots';

const MembershipOrderSnapshotRepository = {
  async findByOrderId(orderId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('madonhang', orderId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async upsert(orderId, payload) {
    const existing = await this.findByOrderId(orderId);
    if (existing) return existing;
    return this.create({ ...payload, madonhang: orderId });
  }
};

module.exports = MembershipOrderSnapshotRepository;
