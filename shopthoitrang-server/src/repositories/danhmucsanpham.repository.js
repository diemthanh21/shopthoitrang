const { createClient } = require('@supabase/supabase-js');
const DanhMucSanPham = require('../models/danhmucsanpham.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'danhmucsanpham';

const DanhMucSanPhamRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('madanhmuc', { ascending: true });
    if (error) throw error;
    return data.map((r) => new DanhMucSanPham(r));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('madanhmuc', id).maybeSingle();
    if (error) throw error;
    return data ? new DanhMucSanPham(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new DanhMucSanPham(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('madanhmuc', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new DanhMucSanPham(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('madanhmuc', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new DanhMucSanPham(data) : null;
  },
};

module.exports = DanhMucSanPhamRepository;
