const { createClient } = require('@supabase/supabase-js');
const TuKhoaTimKiem = require('../models/tukhoatimkiem.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const TuKhoaTimKiemRepository = {
  async getAll() {
    const { data, error } = await supabase.from('tukhoatimkiem').select('*');
    if (error) return [];
    return data.map(row => new TuKhoaTimKiem(row));
  },

  async getById(ma) {
    const { data, error } = await supabase
      .from('tukhoatimkiem')
      .select('*')
      .eq('matukhoa', ma)
      .single();

    if (error || !data) return null;
    return new TuKhoaTimKiem(data);
  },

  async create(obj) {
    const { data, error } = await supabase.from('tukhoatimkiem').insert([obj]).single();
    if (error) return null;
    return new TuKhoaTimKiem(data);
  },

  async update(ma, fields) {
    const { data, error } = await supabase
      .from('tukhoatimkiem')
      .update(fields)
      .eq('matukhoa', ma)
      .single();
    if (error || !data) return null;
    return new TuKhoaTimKiem(data);
  },

  async delete(ma) {
    const { data, error } = await supabase
      .from('tukhoatimkiem')
      .delete()
      .eq('matukhoa', ma)
      .single();
    if (error || !data) return null;
    return new TuKhoaTimKiem(data);
  }
};

module.exports = TuKhoaTimKiemRepository;
