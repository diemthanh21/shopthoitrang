const { createClient } = require('@supabase/supabase-js');
const KhuyenMai = require('../models/khuyenmai.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'khuyenmai';

const KhuyenMaiRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.masanpham) query = query.eq('masanpham', filters.masanpham);
    if (filters.manhanvien) query = query.eq('manhanvien', filters.manhanvien);
    if (filters.active === 'true') {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      query = query.lte('ngaybatdau', today).gte('ngayketthuc', today);
    }

    const { data, error } = await query.order('makhuyenmai', { ascending: true });
    if (error) throw error;
    return data.map(r => new KhuyenMai(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('makhuyenmai', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new KhuyenMai(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new KhuyenMai(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('makhuyenmai', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new KhuyenMai(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('makhuyenmai', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new KhuyenMai(data) : null;
  },
};

module.exports = KhuyenMaiRepository;
