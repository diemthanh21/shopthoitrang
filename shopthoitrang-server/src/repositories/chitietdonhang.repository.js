const { createClient } = require('@supabase/supabase-js');
const ChiTietDonHang = require('../models/chitietdonhang.model');

const supabase = require('../../config/db');
const TABLE = 'chitietdonhang';

const ChiTietDonHangRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('machitietdonhang', { ascending: true });
    if (error) throw error;
    return data.map(row => new ChiTietDonHang(row));
  },
  
  async getByOrderId(madonhang) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('madonhang', madonhang)
      .order('machitietdonhang', { ascending: true });
    if (error) throw error;
    return (data || []).map(row => new ChiTietDonHang(row));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('machitietdonhang', id).single();
    if (error || !data) return null;
    return new ChiTietDonHang(data);
  },

  async create(entity) {
    const { data, error } = await supabase.from(TABLE).insert([entity]).select().single();
    if (error) throw error;
    return new ChiTietDonHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('machitietdonhang', id).select().single();
    if (error || !data) return null;
    return new ChiTietDonHang(data);
  },

  async delete(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('machitietdonhang', id).select().single();
    if (error || !data) return null;
    return new ChiTietDonHang(data);
  }
};

module.exports = ChiTietDonHangRepository;
