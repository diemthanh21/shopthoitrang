const supabase = require('../../config/db');
const TraHang = require('../models/trahang.model');

const TABLE = 'trahang';

const TraHangRepository = {
  async getAll(filters = {}) {
    let q = supabase.from(TABLE).select('*');

    if (filters.makhachhang) q = q.eq('makhachhang', filters.makhachhang);
    if (filters.madonhang) q = q.eq('madonhang', filters.madonhang);
    if (filters.trangthai) q = q.eq('trangthai', filters.trangthai);
    if (filters.from) q = q.gte('ngayyeucau', filters.from);
    if (filters.to) q = q.lte('ngayyeucau', filters.to);

    const { data, error } = await q.order('ngayyeucau', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => new TraHang(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('matrahang', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new TraHang(data) : null;
  },

  async getByDonHang(madonhang) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('madonhang', madonhang)
      .order('ngayyeucau', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => new TraHang(r));
  },

  async create(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*')
      .single();
    if (error) throw error;
    return new TraHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('matrahang', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new TraHang(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('matrahang', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new TraHang(data) : null;
  },
};

module.exports = TraHangRepository;
