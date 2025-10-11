const { createClient } = require('@supabase/supabase-js');
const CaLamViec = require('../models/calamviec.model');

const supabase = require('../../config/db');
const TABLE = 'calamviec';

const CaLamViecRepository = {
  async getAll({ search, limit = 50, offset = 0, orderBy = 'maca', orderDir = 'asc' } = {}) {
    let q = supabase.from(TABLE).select('*', { count: 'exact' });

    if (search && search.trim()) {
      q = q.ilike('tenca', `%${search}%`);
    }

    q = q.order(orderBy, { ascending: orderDir.toLowerCase() !== 'desc' })
         .range(offset, offset + limit - 1);

    const { data, error, count } = await q;
    if (error) throw error;

    return {
      items: (data || []).map(r => new CaLamViec(r)),
      total: count ?? 0,
    };
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('maca', id).maybeSingle();
    if (error) throw error;
    return data ? new CaLamViec(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new CaLamViec(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('maca', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new CaLamViec(data) : null;
  },

  async remove(id) {
    const { error, count } = await supabase.from(TABLE).delete({ count: 'exact' }).eq('maca', id);
    if (error) throw error;
    return (count ?? 0) > 0;
  },
};

module.exports = CaLamViecRepository;
