const supabase = require('../../config/db');

const TABLE = 'doihang_log';

module.exports = {
  async log(madoihang, action, fromStatus, toStatus, note, actorType = 'SYSTEM', actorId = null) {
    try {
      await supabase.from(TABLE).insert([{ madoihang, action, from_status: fromStatus, to_status: toStatus, note, actor_type: actorType, actor_id: actorId, created_at: new Date().toISOString() }]);
    } catch (e) {
      console.warn('Failed to write doihang_log', e.message);
    }
  },
  async list(madoihang) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('madoihang', madoihang).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }
};
