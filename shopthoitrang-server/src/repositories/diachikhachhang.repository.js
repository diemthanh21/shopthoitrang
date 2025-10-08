const { createClient } = require('@supabase/supabase-js');
const DiaChiKhachHang = require('../models/diachikhachhang.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'diachikhachhang';

const DiaChiKhachHangRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('madiachi', { ascending: true });
    if (error) throw error;
    return data.map((r) => new DiaChiKhachHang(r));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('madiachi', id).maybeSingle();
    if (error) throw error;
    return data ? new DiaChiKhachHang(data) : null;
  },

  async getByCustomerId(makhachhang) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('makhachhang', makhachhang);
    if (error) throw error;
    return data.map((r) => new DiaChiKhachHang(r));
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new DiaChiKhachHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('madiachi', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new DiaChiKhachHang(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('madiachi', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new DiaChiKhachHang(data) : null;
  },
};

module.exports = DiaChiKhachHangRepository;
