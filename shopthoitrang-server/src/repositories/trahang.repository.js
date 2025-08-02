const { createClient } = require('@supabase/supabase-js');
const TraHang = require('../models/trahang.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const TraHangRepository = {
  async getAll() {
    const { data, error } = await supabase.from('trahang').select('*');
    if (error) return [];
    return data.map(row => new TraHang(row));
  },

  async getById(ma) {
    const { data, error } = await supabase.from('trahang').select('*').eq('matrahang', ma).single();
    if (error || !data) return null;
    return new TraHang(data);
  },

  async getByDonHang(maDonHang) {
    const { data, error } = await supabase.from('trahang').select('*').eq('madonhang', maDonHang);
    if (error) return [];
    return data.map(row => new TraHang(row));
  },

  async create(obj) {
    const { data, error } = await supabase.from('trahang').insert([obj]).single();
    if (error) return null;
    return new TraHang(data);
  },

  async update(ma, fields) {
    const { data, error } = await supabase.from('trahang').update(fields).eq('matrahang', ma).single();
    if (error || !data) return null;
    return new TraHang(data);
  },

  async delete(ma) {
    const { data, error } = await supabase.from('trahang').delete().eq('matrahang', ma).single();
    if (error || !data) return null;
    return new TraHang(data);
  }
};

module.exports = TraHangRepository;
