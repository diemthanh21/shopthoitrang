const { createClient } = require('@supabase/supabase-js');
const HinhAnhSanPham = require('../models/hinhanhsanpham.model');

const supabase = require('../../config/db');
const TABLE = 'hinhanhsanpham';

const HinhAnhSanPhamRepository = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('mahinhanh', { ascending: true });
    if (error) throw error;
    return data.map(r => new HinhAnhSanPham(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('mahinhanh', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new HinhAnhSanPham(data) : null;
  },

  async getByProductDetail(machitietsanpham) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('machitietsanpham', machitietsanpham);
    if (error) throw error;
    return data.map(r => new HinhAnhSanPham(r));
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new HinhAnhSanPham(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('mahinhanh', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new HinhAnhSanPham(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('mahinhanh', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new HinhAnhSanPham(data) : null;
  },
};

module.exports = HinhAnhSanPhamRepository;
