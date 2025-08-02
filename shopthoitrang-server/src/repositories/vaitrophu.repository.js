const { createClient } = require('@supabase/supabase-js');
const VaiTroPhu = require('../models/vaitrophu.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const VaiTroPhuRepository = {
  async getAll() {
    const { data, error } = await supabase.from('vaitrophu').select('*');
    if (error) return [];
    return data.map(row => new VaiTroPhu(row));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('vaitrophu')
      .select('*')
      .eq('mavaitro', id)
      .single();
    if (error || !data) return null;
    return new VaiTroPhu(data);
  },

  async create(data) {
    const { data: created, error } = await supabase
      .from('vaitrophu')
      .insert([data])
      .single();
    if (error) return null;
    return new VaiTroPhu(created);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('vaitrophu')
      .update(fields)
      .eq('mavaitro', id)
      .single();
    if (error || !data) return null;
    return new VaiTroPhu(data);
  },

  async delete(id) {
    const { error } = await supabase
      .from('vaitrophu')
      .delete()
      .eq('mavaitro', id);
    return !error;
  }
};

module.exports = VaiTroPhuRepository;
