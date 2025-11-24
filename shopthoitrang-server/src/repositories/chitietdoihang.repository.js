const supabase = require('../../config/db');
const ChiTietDoiHang = require('../models/chitietdoihang.model');

const TABLE = 'chitietdoihang';

const ChiTietDoiHangRepository = {
  async listByExchangeId(madoihang) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('madoihang', madoihang)
      .order('mactdoihang', { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => new ChiTietDoiHang(row));
  },

  async listByExchangeIds(ids = []) {
    if (!ids.length) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .in('madoihang', ids);
    if (error) throw error;
    return (data || []).map((row) => new ChiTietDoiHang(row));
  },

  async insertMany(rows) {
    if (!rows.length) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .insert(rows)
      .select('*');
    if (error) throw error;
    return (data || []).map((row) => new ChiTietDoiHang(row));
  },

  async removeByExchangeId(madoihang) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('madoihang', madoihang);
    if (error) throw error;
  },
};

module.exports = ChiTietDoiHangRepository;
