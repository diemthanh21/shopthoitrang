const supabase = require('../../config/db');

const TABLE = 'donhang_trangthai_audit';

const DonHangTrangThaiAuditRepository = {
  async create(entry) {
    const payload = {
      madonhang: entry.madonhang,
      old_trangthai: entry.old_trangthai || null,
      new_trangthai: entry.new_trangthai || null,
      actor_type: entry.actor_type || null,
      actor_id: entry.actor_id || null,
      actor_name: entry.actor_name || null,
      note: entry.note || null,
    };
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').maybeSingle();
    if (error) throw error;
    return data || null;
  }
};

module.exports = DonHangTrangThaiAuditRepository;
