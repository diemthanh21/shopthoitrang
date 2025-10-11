const { createClient } = require('@supabase/supabase-js');
const ChotCa = require('../models/chotca.model');
const supabase = require('../../config/db');
const TABLE = 'chotca';

const ChotCaRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.maphancong) query = query.eq('maphancong', filters.maphancong);
    if (filters.maca) query = query.eq('maca', filters.maca);
    if (filters.manhanvien) query = query.eq('manhanvien', filters.manhanvien);

    const { data, error } = await query.order('ngaychotca', { ascending: false });
    if (error) throw error;
    return data.map((r) => new ChotCa(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('machotca', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new ChotCa(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new ChotCa(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('machotca', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new ChotCa(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('machotca', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new ChotCa(data) : null;
  },
};

module.exports = ChotCaRepository;
