const { createClient } = require('@supabase/supabase-js');
const ChiTietSanPham = require('../models/chitietsanpham.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ChiTietSanPhamRepository = {
  async getAll() {
    const { data, error } = await supabase.from('chitietsanpham').select('*');
    if (error) return [];
    return data.map(row => new ChiTietSanPham(row));
  },

  async getById(machitietsanpham) {
    const { data, error } = await supabase
      .from('chitietsanpham')
      .select('*')
      .eq('machitietsanpham', machitietsanpham)
      .single();
    if (error || !data) return null;
    return new ChiTietSanPham(data);
  },

  async getByMaSanPham(masanpham) {
    const { data, error } = await supabase
      .from('chitietsanpham')
      .select('*')
      .eq('masanpham', masanpham);
    if (error) return [];
    return data.map(row => new ChiTietSanPham(row));
  },

  async create(ctsp) {
    const { data, error } = await supabase
      .from('chitietsanpham')
      .insert([ctsp])
      .single();
    if (error) return null;
    return new ChiTietSanPham(data);
  },

  async update(machitietsanpham, fields) {
    const { data, error } = await supabase
      .from('chitietsanpham')
      .update(fields)
      .eq('machitietsanpham', machitietsanpham)
      .single();
    if (error || !data) return null;
    return new ChiTietSanPham(data);
  },

  async delete(machitietsanpham) {
    const { data, error } = await supabase
      .from('chitietsanpham')
      .delete()
      .eq('machitietsanpham', machitietsanpham)
      .single();
    if (error || !data) return null;
    return new ChiTietSanPham(data);
  },

  async searchByKeyword(keyword) {
    const { data, error } = await supabase
      .from('chitietsanpham')
      .select('*')
      .ilike('mota', `%${keyword}%`);
    if (error) return [];
    return data.map(row => new ChiTietSanPham(row));
  }
};

module.exports = ChiTietSanPhamRepository;