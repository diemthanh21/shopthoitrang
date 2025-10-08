const { createClient } = require('@supabase/supabase-js');
const MaGiamGia = require('../models/magiamgia.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'magiamgia';

const MaGiamGiaRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.macode) query = query.ilike('macode', `%${filters.macode}%`);
    if (filters.active === 'true') {
      const today = new Date().toISOString().slice(0, 10);
      query = query.lte('ngaybatdau', today).gte('ngayketthuc', today);
    }

    const { data, error } = await query.order('mavoucher', { ascending: true });
    if (error) throw error;
    return data.map(r => new MaGiamGia(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('mavoucher', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new MaGiamGia(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new MaGiamGia(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('mavoucher', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new MaGiamGia(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('mavoucher', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new MaGiamGia(data) : null;
  }
};

module.exports = MaGiamGiaRepository;
