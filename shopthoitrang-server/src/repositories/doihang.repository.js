const { createClient } = require('@supabase/supabase-js');
const DoiHang = require('../models/doihang.model');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const DoiHangRepository = {
  async getAll() {
    const { data, error } = await supabase.from('doihang').select('*');
    if (error) return [];
    return data.map(row => new DoiHang(row));
  },

  async getById(id) {
    const { data, error } = await supabase.from('doihang').select('*').eq('madoihang', id).single();
    if (error || !data) return null;
    return new DoiHang(data);
  },

  async findByDonHang(maDonHang) {
    const { data, error } = await supabase.from('doihang').select('*').eq('madonhang', maDonHang);
    if (error) return [];
    return data.map(row => new DoiHang(row));
  },

  async findByKhachHang(maKH) {
    const { data, error } = await supabase.from('doihang').select('*').eq('makhachhang', maKH);
    if (error) return [];
    return data.map(row => new DoiHang(row));
  },

  async create(obj) {
    const { data, error } = await supabase.from('doihang').insert([obj]).single();
    if (error) return null;
    return new DoiHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from('doihang').update(fields).eq('madoihang', id).single();
    if (error || !data) return null;
    return new DoiHang(data);
  },

  async delete(id) {
    const { error } = await supabase.from('doihang').delete().eq('madoihang', id);
    return !error;
  }
};

module.exports = DoiHangRepository;
