const supabase = require('../../config/db');
const LichSuDonHang = require('../models/lichsudonhang.model');

const TABLE = 'lichsudonhang';

const LichSuDonHangRepository = {
  async create(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*')
      .single();
    
    if (error) throw error;
    return new LichSuDonHang(data);
  },

  async getByOrder(madonhang) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('madonhang', madonhang)
      .order('thoigian', { ascending: false });
    
    if (error) throw error;
    return data.map(r => new LichSuDonHang(r));
  },

  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');
    
    if (filters.madonhang) {
      query = query.eq('madonhang', filters.madonhang);
    }
    if (filters.manhanvien) {
      query = query.eq('manhanvien', filters.manhanvien);
    }
    if (filters.from) {
      query = query.gte('thoigian', filters.from);
    }
    if (filters.to) {
      query = query.lte('thoigian', filters.to);
    }
    
    const { data, error } = await query.order('thoigian', { ascending: false });
    
    if (error) throw error;
    return data.map(r => new LichSuDonHang(r));
  },
};

module.exports = LichSuDonHangRepository;
