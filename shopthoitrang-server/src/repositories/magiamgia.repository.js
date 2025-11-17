// src/repositories/magiamgia.repository.js
const supabase = require('../../config/db');
const MaGiamGia = require('../models/magiamgia.model');

const TABLE = 'magiamgia';

const MaGiamGiaRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.macode) {
      query = query.ilike('macode', `%${filters.macode}%`);
    }

    if (filters.maloaivoucher) {
      query = query.eq('maloaivoucher', filters.maloaivoucher);
    }

    if (filters.hinhthuc_giam) {
      query = query.eq('hinhthuc_giam', String(filters.hinhthuc_giam).toUpperCase());
    }

    // active = 'true' -> đang trong khoảng ngày bắt đầu / kết thúc
    if (filters.active === 'true') {
      const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
      query = query.lte('ngaybatdau', today).gte('ngayketthuc', today);
    }

    const { data, error } = await query.order('mavoucher', { ascending: true });
    if (error) throw error;

    return (data || []).map((row) => new MaGiamGia(row));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('mavoucher', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return new MaGiamGia(data);
  },

  async create(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*')
      .single();

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
    if (!data) return null;
    return new MaGiamGia(data);
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('mavoucher', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return new MaGiamGia(data);
  },
};

module.exports = MaGiamGiaRepository;
