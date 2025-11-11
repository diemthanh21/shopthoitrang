const { createClient } = require('@supabase/supabase-js');
const DoiHang = require('../models/doihang.model');

const supabase = require('../../config/db');
const TABLE = 'doihang';

const DoiHangRepository = {
  async getAll(filters = {}) {
    let q = supabase.from(TABLE).select('*');
    if (filters.makhachhang) q = q.eq('makhachhang', filters.makhachhang);
    if (filters.madonhang) q = q.eq('madonhang', filters.madonhang);
    if (filters.trangthai) q = q.eq('trangthai', filters.trangthai);
    if (filters.from) q = q.gte('ngayyeucau', filters.from);
    if (filters.to) q = q.lte('ngayyeucau', filters.to);
    const { data, error } = await q.order('ngayyeucau', { ascending: false });
    if (error) throw error;
    return data.map(r => new DoiHang(r));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('madoihang', id).maybeSingle();
    if (error) throw error;
    return data ? new DoiHang(data) : null;
  },

  async getByCustomer(makhachhang) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('makhachhang', makhachhang);
    if (error) throw error;
    return data.map(r => new DoiHang(r));
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new DoiHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('madoihang', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new DoiHang(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('madoihang', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new DoiHang(data) : null;
  },
};

module.exports = DoiHangRepository;
