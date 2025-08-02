const { createClient } = require('@supabase/supabase-js');
const Banner = require('../models/banner.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const BannerRepository = {
  async getAll() {
    const { data, error } = await supabase.from('banner').select('*');
    if (error) return [];
    return data.map(row => new Banner(row));
  },

  async getById(mabanner) {
    const { data, error } = await supabase.from('banner').select('*').eq('mabanner', mabanner).single();
    if (error || !data) return null;
    return new Banner(data);
  },

  async create(banner) {
    const { data, error } = await supabase.from('banner').insert([banner]).single();
    if (error) return null;
    return new Banner(data);
  },

  async update(mabanner, fields) {
    const { data, error } = await supabase.from('banner').update(fields).eq('mabanner', mabanner).single();
    if (error || !data) return null;
    return new Banner(data);
  },

  async delete(mabanner) {
    const { data, error } = await supabase.from('banner').delete().eq('mabanner', mabanner).single();
    if (error || !data) return null;
    return new Banner(data);
  },

  async searchByStatus(danghoatdong) {
    const { data, error } = await supabase.from('banner').select('*').eq('danghoatdong', danghoatdong);
    if (error) return [];
    return data.map(row => new Banner(row));
  }
};

module.exports = BannerRepository;