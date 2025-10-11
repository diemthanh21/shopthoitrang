const { createClient } = require('@supabase/supabase-js');
const LichSuTimKiem = require('../models/lichsutimkiem.model');

const supabase = require('../../config/db');
const TABLE = 'lichsutimkiem';

const LichSuTimKiemRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.makhachhang) query = query.eq('makhachhang', filters.makhachhang);
    if (filters.machitietsanpham) query = query.eq('machitietsanpham', filters.machitietsanpham);
    if (filters.from) query = query.gte('thoigiantk', filters.from);          // ISO string
    if (filters.to) query = query.lte('thoigiantk', filters.to);              // ISO string

    const { data, error } = await query.order('thoigiantk', { ascending: false });
    if (error) throw error;
    return data.map(r => new LichSuTimKiem(r));
    },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('malichsu', id)
      .maybeSingle();

    if (error) throw error;
    return data ? new LichSuTimKiem(data) : null;
  },

  async getByCustomer(makhachhang) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('makhachhang', makhachhang)
      .order('thoigiantk', { ascending: false });

    if (error) throw error;
    return data.map(r => new LichSuTimKiem(r));
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new LichSuTimKiem(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('malichsu', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? new LichSuTimKiem(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('malichsu', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? new LichSuTimKiem(data) : null;
  },
};

module.exports = LichSuTimKiemRepository;
