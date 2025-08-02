const { createClient } = require('@supabase/supabase-js');
const HinhAnhSanPham = require('../models/hinhanhsanpham.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const HinhAnhSanPhamRepository = {
  async getAll() {
    const { data, error } = await supabase.from('hinhanhsanpham').select('*');
    if (error) return [];
    return data.map(row => new HinhAnhSanPham(row));
  },

  async getById(mahinhanh) {
    const { data, error } = await supabase
      .from('hinhanhsanpham')
      .select('*')
      .eq('mahinhanh', mahinhanh)
      .single();

    if (error || !data) return null;
    return new HinhAnhSanPham(data);
  },

  async getByMaChiTietSanPham(machitietsanpham) {
    const { data, error } = await supabase
      .from('hinhanhsanpham')
      .select('*')
      .eq('machitietsanpham', machitietsanpham);

    if (error) return [];
    return data.map(row => new HinhAnhSanPham(row));
  },

  async create(hinhAnh) {
    const { data, error } = await supabase
      .from('hinhanhsanpham')
      .insert([hinhAnh])
      .single();

    if (error) return null;
    return new HinhAnhSanPham(data);
  },

  async update(mahinhanh, fields) {
    const { data, error } = await supabase
      .from('hinhanhsanpham')
      .update(fields)
      .eq('mahinhanh', mahinhanh)
      .single();

    if (error || !data) return null;
    return new HinhAnhSanPham(data);
  },

  async delete(mahinhanh) {
    const { data, error } = await supabase
      .from('hinhanhsanpham')
      .delete()
      .eq('mahinhanh', mahinhanh)
      .single();

    if (error || !data) return null;
    return new HinhAnhSanPham(data);
  }
};

module.exports = HinhAnhSanPhamRepository;