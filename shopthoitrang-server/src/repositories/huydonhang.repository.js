const { createClient } = require('@supabase/supabase-js');
const HuyDonHang = require('../models/huydonhang.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const HuyDonHangRepository = {
  async getAll() {
    const { data, error } = await supabase.from('huydonhang').select('*');
    if (error) return [];
    return data.map(row => new HuyDonHang(row));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('huydonhang')
      .select('*')
      .eq('mahuydon', id)
      .single();
    if (error || !data) return null;
    return new HuyDonHang(data);
  },

  async create(huydon) {
    const { data, error } = await supabase
      .from('huydonhang')
      .insert([huydon])
      .single();
    if (error) return null;
    return new HuyDonHang(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('huydonhang')
      .update(fields)
      .eq('mahuydon', id)
      .single();
    if (error || !data) return null;
    return new HuyDonHang(data);
  },

  async delete(id) {
    const { data, error } = await supabase
      .from('huydonhang')
      .delete()
      .eq('mahuydon', id)
      .single();
    if (error || !data) return null;
    return new HuyDonHang(data);
  }
};

module.exports = HuyDonHangRepository;
