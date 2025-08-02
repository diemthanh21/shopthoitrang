const { createClient } = require('@supabase/supabase-js');
const CTBanner = require('../models/ctbanner.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const CTBannerRepository = {
  async getAll() {
    const { data, error } = await supabase.from('ctbanner').select('*');
    if (error) return [];
    return data.map(row => new CTBanner(row));
  },

  async getByMaBanner(mabanner) {
    const { data, error } = await supabase
      .from('ctbanner')
      .select('*')
      .eq('mabanner', mabanner);

    if (error) return [];
    return data.map(row => new CTBanner(row));
  },

  async create(data) {
    const { data: created, error } = await supabase
      .from('ctbanner')
      .insert([data])
      .single();

    if (error) return null;
    return new CTBanner(created);
  },

  async delete(mabanner, manhanvien) {
    const { error } = await supabase
      .from('ctbanner')
      .delete()
      .eq('mabanner', mabanner)
      .eq('manhanvien', manhanvien);

    return !error;
  }
};

module.exports = CTBannerRepository;
