const { createClient } = require('@supabase/supabase-js');
const TichLuyChiTieu = require('../models/tichluy_chitieu.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'tieuchi_tichluy';

const TichLuyChiTieuRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('id', { ascending: true });
    if (error) throw error;
    return data.map(r => new TichLuyChiTieu(r));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? new TichLuyChiTieu(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new TichLuyChiTieu(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new TichLuyChiTieu(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new TichLuyChiTieu(data) : null;
  }
};

module.exports = TichLuyChiTieuRepository;
