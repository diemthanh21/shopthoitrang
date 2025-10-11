const { createClient } = require('@supabase/supabase-js');
const DonHang = require('../models/donhang.model');

const supabase = require('../../config/db');
const TABLE = 'donhang';

const DonHangRepository = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('madonhang', { ascending: true });
    if (error) throw error;
    return data.map(r => new DonHang(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('madonhang', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new DonHang(data) : null;
  },

  async getByCustomer(makhachhang) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('makhachhang', makhachhang)
      .order('ngaydathang', { ascending: false });
    if (error) throw error;
    return data.map(r => new DonHang(r));
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new DonHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('madonhang', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new DonHang(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('madonhang', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new DonHang(data) : null;
  },
};

module.exports = DonHangRepository;
