const { createClient } = require('@supabase/supabase-js');
const ChiTietPhieuNhap = require('../models/chitietphieunhap.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ChiTietPhieuNhapRepository = {
  async getAll() {
    const { data, error } = await supabase.from('chitietphieunhap').select('*');
    if (error) return [];
    return data.map(row => new ChiTietPhieuNhap(row));
  },

  async getById(ma) {
    const { data, error } = await supabase
      .from('chitietphieunhap')
      .select('*')
      .eq('machitietnhap', ma)
      .single();
    if (error || !data) return null;
    return new ChiTietPhieuNhap(data);
  },

  async findByPhieuNhap(maPhieuNhap) {
    const { data, error } = await supabase
      .from('chitietphieunhap')
      .select('*')
      .eq('maphieunhap', maPhieuNhap);
    if (error) return [];
    return data.map(row => new ChiTietPhieuNhap(row));
  },

  async findByChiTietSanPham(maCTSP) {
    const { data, error } = await supabase
      .from('chitietphieunhap')
      .select('*')
      .eq('machitietsanpham', maCTSP);
    if (error) return [];
    return data.map(row => new ChiTietPhieuNhap(row));
  },

  async create(obj) {
    const { data, error } = await supabase
      .from('chitietphieunhap')
      .insert([obj])
      .single();
    if (error) return null;
    return new ChiTietPhieuNhap(data);
  },

  async update(ma, fields) {
    const { data, error } = await supabase
      .from('chitietphieunhap')
      .update(fields)
      .eq('machitietnhap', ma)
      .single();
    if (error || !data) return null;
    return new ChiTietPhieuNhap(data);
  },

  async delete(ma) {
    const { error } = await supabase
      .from('chitietphieunhap')
      .delete()
      .eq('machitietnhap', ma);
    return !error;
  }
};

module.exports = ChiTietPhieuNhapRepository;
