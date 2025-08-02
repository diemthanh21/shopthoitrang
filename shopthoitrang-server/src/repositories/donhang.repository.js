const { createClient } = require('@supabase/supabase-js');
const DonHang = require('../models/donhang.model');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const DonHangRepository = {
  async getAll() {
    const { data, error } = await supabase.from('donhang').select('*');
    if (error) return [];
    return data.map(row => new DonHang(row));
  },

  async getById(id) {
    const { data, error } = await supabase.from('donhang').select('*').eq('madonhang', id).single();
    if (error || !data) return null;
    return new DonHang(data);
  },

  async findByKhachHang(maKH) {
    const { data, error } = await supabase.from('donhang').select('*').eq('makhachhang', maKH);
    if (error) return [];
    return data.map(row => new DonHang(row));
  },

  async create(obj) {
    const { data, error } = await supabase.from('donhang').insert([obj]).single();
    if (error) return null;
    return new DonHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from('donhang').update(fields).eq('madonhang', id).single();
    if (error || !data) return null;
    return new DonHang(data);
  },

  async delete(id) {
    const { error } = await supabase.from('donhang').delete().eq('madonhang', id);
    return !error;
  }
};

module.exports = DonHangRepository;