const { createClient } = require('@supabase/supabase-js');
const DanhGia = require('../models/danhgia.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const DanhGiaRepository = {
  async getAll() {
    const { data, error } = await supabase.from('danhgia').select('*');
    if (error) return [];
    return data.map(row => new DanhGia(row));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('danhgia')
      .select('*')
      .eq('madanhgia', id)
      .single();
    if (error || !data) return null;
    return new DanhGia(data);
  },

  async findBySanPham(maSP) {
    const { data, error } = await supabase
      .from('danhgia')
      .select('*')
      .eq('masanpham', maSP);
    if (error) return [];
    return data.map(row => new DanhGia(row));
  },

  async findByKhachHang(maKH) {
    const { data, error } = await supabase
      .from('danhgia')
      .select('*')
      .eq('makhachhang', maKH);
    if (error) return [];
    return data.map(row => new DanhGia(row));
  },

  async findByChiTietDonHang(maCTDH) {
    const { data, error } = await supabase
      .from('danhgia')
      .select('*')
      .eq('machitietdonhang', maCTDH);
    if (error) return [];
    return data.map(row => new DanhGia(row));
  },

  async create(obj) {
    const { data, error } = await supabase.from('danhgia').insert([obj]).single();
    if (error) return null;
    return new DanhGia(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('danhgia')
      .update(fields)
      .eq('madanhgia', id)
      .single();
    if (error || !data) return null;
    return new DanhGia(data);
  },

  async delete(id) {
    const { error } = await supabase
      .from('danhgia')
      .delete()
      .eq('madanhgia', id);
    return !error;
  }
};

module.exports = DanhGiaRepository;
