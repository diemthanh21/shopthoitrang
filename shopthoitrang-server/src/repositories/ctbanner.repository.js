const { createClient } = require('@supabase/supabase-js');
const CTBanner = require('../models/ctbanner.model');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'ctbanner';

const CTBannerRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.mabanner) query = query.eq('mabanner', filters.mabanner);
    if (filters.manhanvien) query = query.eq('manhanvien', filters.manhanvien);

    const { data, error } = await query.order('thoigiandoi', { ascending: false });
    if (error) throw error;
    return data.map((r) => new CTBanner(r));
  },

  async getById(mabanner, manhanvien) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('mabanner', mabanner)
      .eq('manhanvien', manhanvien)
      .maybeSingle();

    if (error) throw error;
    return data ? new CTBanner(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new CTBanner(data);
  },

  async update(mabanner, manhanvien, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('mabanner', mabanner)
      .eq('manhanvien', manhanvien)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? new CTBanner(data) : null;
  },

  async remove(mabanner, manhanvien) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('mabanner', mabanner)
      .eq('manhanvien', manhanvien)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? new CTBanner(data) : null;
  },
};

module.exports = CTBannerRepository;
