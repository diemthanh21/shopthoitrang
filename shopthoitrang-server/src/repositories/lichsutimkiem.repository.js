const { createClient } = require('@supabase/supabase-js');
const LichSuTimKiem = require('../models/lichsutimkiem.model');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const repo = {
  async getAll() {
    const { data, error } = await supabase.from('lichsutimkiem').select('*');
    if (error) return [];
    return data.map(row => new LichSuTimKiem(row));
  },

  async getById(ma) {
    const { data, error } = await supabase
      .from('lichsutimkiem')
      .select('*')
      .eq('malichsu', ma)
      .single();
    if (error || !data) return null;
    return new LichSuTimKiem(data);
  },

  async getByKhachHang(maKH) {
    const { data, error } = await supabase
      .from('lichsutimkiem')
      .select('*')
      .eq('makhachhang', maKH);
    if (error) return [];
    return data.map(row => new LichSuTimKiem(row));
  },

  async create(data) {
    const { data: inserted, error } = await supabase
      .from('lichsutimkiem')
      .insert([data])
      .single();
    if (error) return null;
    return new LichSuTimKiem(inserted);
  },

  async update(ma, fields) {
    const { data, error } = await supabase
      .from('lichsutimkiem')
      .update(fields)
      .eq('malichsu', ma)
      .single();
    if (error || !data) return null;
    return new LichSuTimKiem(data);
  },

  async delete(ma) {
    const { data, error } = await supabase
      .from('lichsutimkiem')
      .delete()
      .eq('malichsu', ma)
      .single();
    if (error || !data) return null;
    return new LichSuTimKiem(data);
  }
};

module.exports = repo;
