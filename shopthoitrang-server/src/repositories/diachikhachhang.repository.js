const { createClient } = require('@supabase/supabase-js');
const DiaChiKhachHang = require('../models/diachikhachhang.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const DiaChiKhachHangRepository = {
  async getAll() {
    const { data, error } = await supabase.from('diachikhachhang').select('*');
    if (error) return [];
    return data.map(row => new DiaChiKhachHang(row));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('diachikhachhang')
      .select('*')
      .eq('madiachi', id)
      .single();
    if (error || !data) return null;
    return new DiaChiKhachHang(data);
  },

  async findByKhachHang(maKH) {
    const { data, error } = await supabase
      .from('diachikhachhang')
      .select('*')
      .eq('makhachhang', maKH);
    if (error) return [];
    return data.map(row => new DiaChiKhachHang(row));
  },

  async create(obj) {
    const { data, error } = await supabase.from('diachikhachhang').insert([obj]).single();
    if (error) return null;
    return new DiaChiKhachHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('diachikhachhang')
      .update(fields)
      .eq('madiachi', id)
      .single();
    if (error || !data) return null;
    return new DiaChiKhachHang(data);
  },

  async delete(id) {
    const { error } = await supabase
      .from('diachikhachhang')
      .delete()
      .eq('madiachi', id);
    return !error;
  }
};

module.exports = DiaChiKhachHangRepository;
