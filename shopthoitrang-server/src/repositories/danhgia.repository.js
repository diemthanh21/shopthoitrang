const { createClient } = require('@supabase/supabase-js');
const DanhGia = require('../models/danhgia.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'danhgia';

const DanhGiaRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.masanpham) query = query.eq('masanpham', filters.masanpham);
    if (filters.makhachhang) query = query.eq('makhachhang', filters.makhachhang);
    if (filters.diemdanhgia) query = query.eq('diemdanhgia', filters.diemdanhgia);

    const { data, error } = await query.order('ngaydanhgia', { ascending: false });
    if (error) throw error;
    return data.map((r) => new DanhGia(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('madanhgia', id)
      .maybeSingle();

    if (error) throw error;
    return data ? new DanhGia(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new DanhGia(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('madanhgia', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? new DanhGia(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('madanhgia', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? new DanhGia(data) : null;
  },
};

module.exports = DanhGiaRepository;
