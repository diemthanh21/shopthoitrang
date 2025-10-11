const { createClient } = require('@supabase/supabase-js');
const ChiTietPhieuDatHang = require('../models/chitietphieudathang.model');

const supabase = require('../../config/db');
const TABLE = 'chitietphieudathang';

const ChiTietPhieuDatHangRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('machitietphieudathang', { ascending: true });
    if (error) throw error;
    return data.map(row => new ChiTietPhieuDatHang(row));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('machitietphieudathang', id).single();
    if (error || !data) return null;
    return new ChiTietPhieuDatHang(data);
  },

  async create(entity) {
    const { data, error } = await supabase.from(TABLE).insert([entity]).select().single();
    if (error) throw error;
    return new ChiTietPhieuDatHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('machitietphieudathang', id).select().single();
    if (error || !data) return null;
    return new ChiTietPhieuDatHang(data);
  },

  async delete(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('machitietphieudathang', id).select().single();
    if (error || !data) return null;
    return new ChiTietPhieuDatHang(data);
  }
};

module.exports = ChiTietPhieuDatHangRepository;
