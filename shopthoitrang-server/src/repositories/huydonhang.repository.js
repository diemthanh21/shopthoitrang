const { createClient } = require('@supabase/supabase-js');
const HuyDonHang = require('../models/huydonhang.model');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const HuyDonHangRepository = {
  async getAll() {
    const { data, error } = await supabase.from('huydonhang').select('*');
    if (error) return [];
    return data.map(row => new HuyDonHang(row));
  },

  async getById(maHuyDon) {
    const { data, error } = await supabase
      .from('huydonhang')
      .select('*')
      .eq('mahuydon', maHuyDon)
      .single();
    if (error || !data) return null;
    return new HuyDonHang(data);
  },

  async getByMaDonHang(maDonHang) {
    const { data, error } = await supabase
      .from('huydonhang')
      .select('*')
      .eq('madonhang', maDonHang);
    if (error) return [];
    return data.map(row => new HuyDonHang(row));
  },

  async create(data) {
    const { data: inserted, error } = await supabase
      .from('huydonhang')
      .insert([data])
      .single();
    if (error) return null;
    return new HuyDonHang(inserted);
  },

  async update(maHuyDon, fields) {
    const { data, error } = await supabase
      .from('huydonhang')
      .update(fields)
      .eq('mahuydon', maHuyDon)
      .single();
    if (error || !data) return null;
    return new HuyDonHang(data);
  },

  async delete(maHuyDon) {
    const { data, error } = await supabase
      .from('huydonhang')
      .delete()
      .eq('mahuydon', maHuyDon)
      .single();
    if (error || !data) return null;
    return new HuyDonHang(data);
  }
};

module.exports = HuyDonHangRepository;
