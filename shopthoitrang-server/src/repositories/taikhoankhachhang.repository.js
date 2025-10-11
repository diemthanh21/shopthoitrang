const { createClient } = require('@supabase/supabase-js');
const TaiKhoanKhachHang = require('../models/taikhoankhachhang.model');

const supabase = require('../../config/db');
const TABLE = 'taikhoankhachhang';

const TaiKhoanKhachHangRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.hoten) query = query.ilike('hoten', `%${filters.hoten}%`);
    if (filters.email) query = query.ilike('email', `%${filters.email}%`);
    if (filters.danghoatdong !== undefined) query = query.eq('danghoatdong', filters.danghoatdong);

    const { data, error } = await query.order('makhachhang', { ascending: true });
    if (error) throw error;
    return data.map(r => new TaiKhoanKhachHang(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('makhachhang', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new TaiKhoanKhachHang(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new TaiKhoanKhachHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('makhachhang', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new TaiKhoanKhachHang(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('makhachhang', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new TaiKhoanKhachHang(data) : null;
  }
};

module.exports = TaiKhoanKhachHangRepository;
