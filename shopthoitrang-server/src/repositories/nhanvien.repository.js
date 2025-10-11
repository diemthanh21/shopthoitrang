const { createClient } = require('@supabase/supabase-js');
const NhanVien = require('../models/nhanvien.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'nhanvien';

const NhanVienRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.machucnang) query = query.eq('machucnang', filters.machucnang);
    if (filters.q) {
      // tìm kiếm đơn giản theo tên / email / sđt
      const q = `%${filters.q}%`;
      query = query.or(`hoten.ilike.${q},email.ilike.${q},sodienthoai.ilike.${q}`);
    }

    const { data, error } = await query.order('manhanvien', { ascending: true });
    if (error) throw error;
    return data.map(r => new NhanVien(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('manhanvien', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new NhanVien(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new NhanVien(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('manhanvien', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new NhanVien(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('manhanvien', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new NhanVien(data) : null;
  },
};

module.exports = NhanVienRepository;
