const { createClient } = require('@supabase/supabase-js');
const PhanCongCa = require('../models/phancongca.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'phancongca';

const PhanCongCaRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.manhanvien) query = query.eq('manhanvien', filters.manhanvien);
    if (filters.maca) query = query.eq('maca', filters.maca);
    if (filters.trangthai) query = query.eq('trangthai', filters.trangthai);
    if (filters.from) query = query.gte('ngaylamviec', filters.from); // 'YYYY-MM-DD'
    if (filters.to) query = query.lte('ngaylamviec', filters.to);

    const { data, error } = await query
      .order('ngaylamviec', { ascending: true })
      .order('maca', { ascending: true });

    if (error) throw error;
    return data.map(r => new PhanCongCa(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('maphancong', id)
      .maybeSingle();

    if (error) throw error;
    return data ? new PhanCongCa(data) : null;
  },

  async getByNhanVien(manhanvien, from, to) {
    let query = supabase.from(TABLE).select('*').eq('manhanvien', manhanvien);
    if (from) query = query.gte('ngaylamviec', from);
    if (to) query = query.lte('ngaylamviec', to);

    const { data, error } = await query.order('ngaylamviec', { ascending: true });
    if (error) throw error;
    return data.map(r => new PhanCongCa(r));
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new PhanCongCa(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('maphancong', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? new PhanCongCa(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('maphancong', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? new PhanCongCa(data) : null;
  }
};

module.exports = PhanCongCaRepository;
