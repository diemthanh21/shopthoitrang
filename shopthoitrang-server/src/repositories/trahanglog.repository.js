const supabase = require('../../config/db');

const TABLE = 'trahang_log';

module.exports = {
  async log(matrahang, action, fromStatus, toStatus, note, actorType = 'SYSTEM', actorId = null) {
    try {
      await supabase.from(TABLE).insert([{ matrahang, action, from_status: fromStatus, to_status: toStatus, note, actor_type: actorType, actor_id: actorId, created_at: new Date().toISOString() }]);
    } catch (e) {
      console.warn('Failed to write trahang_log', e.message);
    }
  },
  async list(matrahang) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('matrahang', matrahang).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }
};
