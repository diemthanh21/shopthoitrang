const { createClient } = require('@supabase/supabase-js');
const ChiTietDonHang = require('../models/chitietdonhang.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ChiTietDonHangRepository = {
  async getAll() {
    const { data, error } = await supabase.from('chitietdonhang').select('*');
    if (error) return [];
    return data.map(row => new ChiTietDonHang(row));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('chitietdonhang')
      .select('*')
      .eq('machitietdonhang', id)
      .single();
    if (error || !data) return null;
    return new ChiTietDonHang(data);
  },

  async findByDonHang(maDonHang) {
    const { data, error } = await supabase
      .from('chitietdonhang')
      .select('*')
      .eq('madonhang', maDonHang);
    if (error) return [];
    return data.map(row => new ChiTietDonHang(row));
  },

  async findByChiTietSanPham(maCTSP) {
    const { data, error } = await supabase
      .from('chitietdonhang')
      .select('*')
      .eq('machitietsanpham', maCTSP);
    if (error) return [];
    return data.map(row => new ChiTietDonHang(row));
  },

  async create(obj) {
    const { data, error } = await supabase
      .from('chitietdonhang')
      .insert([obj])
      .single();
    if (error) return null;
    return new ChiTietDonHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('chitietdonhang')
      .update(fields)
      .eq('machitietdonhang', id)
      .single();
    if (error || !data) return null;
    return new ChiTietDonHang(data);
  },

  async delete(id) {
    const { error } = await supabase
      .from('chitietdonhang')
      .delete()
      .eq('machitietdonhang', id);
    return !error;
  }
};

module.exports = ChiTietDonHangRepository;
