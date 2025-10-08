const { createClient } = require('@supabase/supabase-js');
const NhaCungCap = require('../models/nhacungcap.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'nhacungcap';

const NhaCungCapRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.tennhacungcap)
      query = query.ilike('tennhacungcap', `%${filters.tennhacungcap}%`);

    const { data, error } = await query.order('manhacungcap', { ascending: true });
    if (error) throw error;
    return data.map(r => new NhaCungCap(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('manhacungcap', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new NhaCungCap(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new NhaCungCap(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('manhacungcap', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new NhaCungCap(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('manhacungcap', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new NhaCungCap(data) : null;
  }
};

module.exports = NhaCungCapRepository;
