const { createClient } = require('@supabase/supabase-js');
const PhieuDatHang = require('../models/phieudathang.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'phieudathang';

const PhieuDatHangRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.makhachhang) query = query.eq('makhachhang', filters.makhachhang);
    if (filters.trangthai) query = query.eq('trangthaiphieu', filters.trangthai);
    if (filters.from) query = query.gte('ngaydatphieu', filters.from);
    if (filters.to) query = query.lte('ngaydatphieu', filters.to);

    const { data, error } = await query.order('ngaydatphieu', { ascending: false });
    if (error) throw error;
    return data.map(r => new PhieuDatHang(r));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('maphieudathang', id).maybeSingle();
    if (error) throw error;
    return data ? new PhieuDatHang(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new PhieuDatHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('maphieudathang', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new PhieuDatHang(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('maphieudathang', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new PhieuDatHang(data) : null;
  }
};

module.exports = PhieuDatHangRepository;
