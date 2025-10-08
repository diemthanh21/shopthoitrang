const { createClient } = require('@supabase/supabase-js');
const ChiTietPhieuNhap = require('../models/chitietphieunhap.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'chitietphieunhap';

const ChiTietPhieuNhapRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('machitietnhap', { ascending: true });
    if (error) throw error;
    return data.map(row => new ChiTietPhieuNhap(row));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('machitietnhap', id).single();
    if (error || !data) return null;
    return new ChiTietPhieuNhap(data);
  },

  async create(entity) {
    const { data, error } = await supabase.from(TABLE).insert([entity]).select().single();
    if (error) throw error;
    return new ChiTietPhieuNhap(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('machitietnhap', id).select().single();
    if (error || !data) return null;
    return new ChiTietPhieuNhap(data);
  },

  async delete(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('machitietnhap', id).select().single();
    if (error || !data) return null;
    return new ChiTietPhieuNhap(data);
  }
};

module.exports = ChiTietPhieuNhapRepository;
