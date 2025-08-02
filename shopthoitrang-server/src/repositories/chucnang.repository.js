const { createClient } = require('@supabase/supabase-js');
const ChucNang = require('../models/chucnang.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ChucNangRepository = {
  async getAll() {
    const { data, error } = await supabase.from('chucnang').select('*');
    if (error) return [];
    return data.map(row => new ChucNang(row));
  },

  async getById(machucnang) {
    const { data, error } = await supabase
      .from('chucnang')
      .select('*')
      .eq('machucnang', machucnang)
      .single();
    if (error || !data) return null;
    return new ChucNang(data);
  },

  async create(chucnang) {
    const { data, error } = await supabase
      .from('chucnang')
      .insert([chucnang])
      .single();
    if (error) return null;
    return new ChucNang(data);
  },

  async update(machucnang, fields) {
    const { data, error } = await supabase
      .from('chucnang')
      .update(fields)
      .eq('machucnang', machucnang)
      .single();
    if (error || !data) return null;
    return new ChucNang(data);
  },

  async delete(machucnang) {
    const { data, error } = await supabase
      .from('chucnang')
      .delete()
      .eq('machucnang', machucnang)
      .single();
    if (error || !data) return null;
    return new ChucNang(data);
  }
};

module.exports = ChucNangRepository;