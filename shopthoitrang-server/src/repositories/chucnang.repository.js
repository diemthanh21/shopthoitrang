const ChucNang = require('../models/chucnang.model');
const supabase = require('../../config/db');

const TABLE = 'chucnang';

const ChucNangRepository = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('machucnang', { ascending: true });
    if (error) throw error;
    return data.map(row => new ChucNang(row));
  },

  async getById(machucnang) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('machucnang', machucnang)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? new ChucNang(data) : null;
  },

  async create(chucnang) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([chucnang])
      .select()
      .single();
    if (error) throw error;
    return new ChucNang(data);
  },

  async update(machucnang, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('machucnang', machucnang)
      .select()
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? new ChucNang(data) : null;
  },

  async delete(machucnang) {
    const { error, count } = await supabase
      .from(TABLE)
      .delete({ count: 'exact' })
      .eq('machucnang', machucnang);
    if (error) throw error;
    return (count ?? 0) > 0;
  }
};

module.exports = ChucNangRepository;
