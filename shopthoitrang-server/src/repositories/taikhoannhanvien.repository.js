const { createClient } = require('@supabase/supabase-js');
const TaiKhoanNhanVien = require('../models/taikhoannhanvien.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'taikhoannhanvien';

const TaiKhoanNhanVienRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*');
    if (error) throw error;
    return data.map(r => new TaiKhoanNhanVien(r));
  },

  async getById(manhanvien) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('manhanvien', manhanvien)
      .maybeSingle();
    if (error) throw error;
    return data ? new TaiKhoanNhanVien(data) : null;
  },

  async getByUsername(tendangnhap) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('tendangnhap', tendangnhap)
      .maybeSingle();
    if (error) throw error;
    return data ? new TaiKhoanNhanVien(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*')
      .single();
    if (error) throw error;
    return new TaiKhoanNhanVien(data);
  },

  async update(manhanvien, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('manhanvien', manhanvien)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new TaiKhoanNhanVien(data) : null;
  },

  async remove(manhanvien) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('manhanvien', manhanvien)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new TaiKhoanNhanVien(data) : null;
  }
};

module.exports = TaiKhoanNhanVienRepository;
