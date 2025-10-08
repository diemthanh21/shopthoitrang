const { createClient } = require('@supabase/supabase-js');
const ThuongHieu = require('../models/thuonghieu.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'thuonghieu';

const ThuongHieuRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('mathuonghieu', { ascending: true });
    if (error) throw error;
    return data.map(row => new ThuongHieu(row));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('mathuonghieu', id).maybeSingle();
    if (error) throw error;
    return data ? new ThuongHieu(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new ThuongHieu(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('mathuonghieu', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new ThuongHieu(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('mathuonghieu', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new ThuongHieu(data) : null;
  }
};

module.exports = ThuongHieuRepository;
