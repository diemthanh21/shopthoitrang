const { createClient } = require('@supabase/supabase-js');
const SanPham = require('../models/sanpham.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'sanpham';

const SanPhamRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.tensanpham) query = query.ilike('tensanpham', `%${filters.tensanpham}%`);
    if (filters.madanhmuc) query = query.eq('madanhmuc', filters.madanhmuc);
    if (filters.mathuonghieu) query = query.eq('mathuonghieu', filters.mathuonghieu);
    if (filters.trangthai) query = query.eq('trangthai', filters.trangthai);

    const { data, error } = await query.order('masanpham', { ascending: true });
    if (error) throw error;
    return data.map(r => new SanPham(r));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('masanpham', id).maybeSingle();
    if (error) throw error;
    return data ? new SanPham(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new SanPham(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('masanpham', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new SanPham(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('masanpham', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new SanPham(data) : null;
  }
};

module.exports = SanPhamRepository;
