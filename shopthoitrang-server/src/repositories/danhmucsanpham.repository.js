const { createClient } = require('@supabase/supabase-js');
const DanhMucSanPham = require('../models/danhmucsanpham.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const DanhMucSanPhamRepository = {
  async getAll() {
    const { data, error } = await supabase.from('danhmucsanpham').select('*');
    if (error) return [];
    return data.map(row => new DanhMucSanPham(row));
  },

  async getById(madanhmuc) {
    const { data, error } = await supabase
      .from('danhmucsanpham')
      .select('*')
      .eq('madanhmuc', madanhmuc)
      .single();
    if (error || !data) return null;
    return new DanhMucSanPham(data);
  },

  async create(data) {
    const { data: created, error } = await supabase
      .from('danhmucsanpham')
      .insert([data])
      .single();
    if (error) return null;
    return new DanhMucSanPham(created);
  },

  async update(madanhmuc, fields) {
    const { data, error } = await supabase
      .from('danhmucsanpham')
      .update(fields)
      .eq('madanhmuc', madanhmuc)
      .single();
    if (error || !data) return null;
    return new DanhMucSanPham(data);
  },

  async delete(madanhmuc) {
    const { error } = await supabase
      .from('danhmucsanpham')
      .delete()
      .eq('madanhmuc', madanhmuc);
    return !error;
  }
};

module.exports = DanhMucSanPhamRepository;
