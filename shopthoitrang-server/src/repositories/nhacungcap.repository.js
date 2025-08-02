const { createClient } = require('@supabase/supabase-js');
const NhaCungCap = require('../models/nhacungcap.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const NhaCungCapRepository = {
  async getAll() {
    const { data, error } = await supabase.from('nhacungcap').select('*');
    if (error) return [];
    return data.map(row => new NhaCungCap(row));
  },

  async getById(ma) {
    const { data, error } = await supabase
      .from('nhacungcap')
      .select('*')
      .eq('manhacungcap', ma)
      .single();
    if (error || !data) return null;
    return new NhaCungCap(data);
  },

  async findByName(name) {
    const { data, error } = await supabase
      .from('nhacungcap')
      .select('*')
      .ilike('tennhacungcap', `%${name}%`);
    if (error) return [];
    return data.map(row => new NhaCungCap(row));
  },

  async create(data) {
    const { data: created, error } = await supabase
      .from('nhacungcap')
      .insert([data])
      .single();
    if (error) return null;
    return new NhaCungCap(created);
  },

  async update(ma, fields) {
    const { data, error } = await supabase
      .from('nhacungcap')
      .update(fields)
      .eq('manhacungcap', ma)
      .single();
    if (error || !data) return null;
    return new NhaCungCap(data);
  },

  async delete(ma) {
    const { error } = await supabase
      .from('nhacungcap')
      .delete()
      .eq('manhacungcap', ma);
    return !error;
  }
};

module.exports = NhaCungCapRepository;
