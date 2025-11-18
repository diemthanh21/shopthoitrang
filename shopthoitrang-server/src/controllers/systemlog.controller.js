const db = require('../../config/db');

module.exports = {
  async list(req, res) {
    try {
      const limit = parseInt(req.query.limit || '100', 10);
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
        created_at: r.created_at
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
        created_at: r.created_at
      }));

      // Sort by created_at desc and slice to limit
      normalized.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

      res.json(normalized.slice(0, limit));
    } catch (e) {
      console.error('[SystemLog] list error', e?.message || e);
      res.status(500).json({ message: e.message || 'Lỗi server' });
    }
  }
};
