const { createClient } = require('@supabase/supabase-js');
const ChiTietSanPham = require('../models/chitietsanpham.model');

const supabase = require('../../config/db');
const TABLE = 'chitietsanpham';

const ChiTietSanPhamRepository = {
  async getAll({
    masanpham,
    search,
    minPrice,
    maxPrice,
    limit = 50,
    offset = 0,
    orderBy = 'machitietsanpham',
    orderDir = 'asc',
  } = {}) {
    let q = supabase.from(TABLE).select('*', { count: 'exact' });

    if (masanpham) q = q.eq('masanpham', Number(masanpham));
    if (search && search.trim()) {
      q = q.or(
        `kichthuoc.ilike.%${search}%,mausac.ilike.%${search}%,chatlieu.ilike.%${search}%,mota.ilike.%${search}%`
      );
    }
    if (minPrice !== undefined) q = q.gte('giaban', Number(minPrice));
    if (maxPrice !== undefined) q = q.lte('giaban', Number(maxPrice));

    q = q
      .order(orderBy, { ascending: (orderDir || 'asc').toLowerCase() !== 'desc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      items: (data || []).map((r) => new ChiTietSanPham(r)),
      total: count ?? 0,
    };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('machitietsanpham', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new ChiTietSanPham(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new ChiTietSanPham(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('machitietsanpham', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new ChiTietSanPham(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('machitietsanpham', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new ChiTietSanPham(data) : null;
  },
};

module.exports = ChiTietSanPhamRepository;
