const { createClient } = require('@supabase/supabase-js');
const TheThanhVien = require('../models/thethanhvien.model');

const supabase = require('../../config/db');
const TABLE = 'thethanhvien';

const TheThanhVienRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*');
    if (error) throw error;
    return data.map(row => new TheThanhVien(row));
  },

  async findByKhachHang(makhachhang) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('makhachhang', makhachhang)
      .order('ngaycap', { ascending: false });
    if (error) throw error;
    return data.map(row => new TheThanhVien(row));
  },

  async findLatestActiveByKhachHang(makhachhang) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('makhachhang', makhachhang)
      .eq('trangthai', true)
      .order('ngaycap', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? new TheThanhVien(data) : null;
  },

  async getById(mathe) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('mathe', mathe)
      .maybeSingle();
    if (error) throw error;
    return data ? new TheThanhVien(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*')
      .single();
    if (error) throw error;
    return new TheThanhVien(data);
  },

  async update(mathe, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('mathe', mathe)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new TheThanhVien(data) : null;
  },

  async remove(mathe) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('mathe', mathe)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new TheThanhVien(data) : null;
  },

  async deactivateAll(makhachhang) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from(TABLE)
      .update({ trangthai: false, ngayhethan: now })
      .eq('makhachhang', makhachhang)
      .eq('trangthai', true);
    if (error) throw error;
  }
};

module.exports = TheThanhVienRepository;
