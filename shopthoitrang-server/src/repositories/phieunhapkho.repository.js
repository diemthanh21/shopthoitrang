const { createClient } = require('@supabase/supabase-js');
const PhieuNhapKho = require('../models/phieunhapkho.model');

const supabase = require('../../config/db');
const TABLE = 'phieunhapkho';

const PhieuNhapKhoRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.manhanvien) query = query.eq('manhanvien', filters.manhanvien);
    if (filters.maphieudathang) query = query.eq('maphieudathang', filters.maphieudathang);
    if (filters.from) query = query.gte('ngaynhap', filters.from);
    if (filters.to) query = query.lte('ngaynhap', filters.to);

    const { data, error } = await query.order('ngaynhap', { ascending: false });
    if (error) throw error;
    return data.map(r => new PhieuNhapKho(r));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('maphieunhap', id).maybeSingle();
    if (error) throw error;
    return data ? new PhieuNhapKho(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new PhieuNhapKho(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('maphieunhap', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new PhieuNhapKho(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('maphieunhap', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new PhieuNhapKho(data) : null;
  }
};

module.exports = PhieuNhapKhoRepository;
