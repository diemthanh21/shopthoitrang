const KichThuoc = require('../models/kichthuoc.model');
const supabase = require('../../config/db');

const TABLE = 'kichthuocs';

const KichThuocRepository = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('makichthuoc', { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => new KichThuoc(row));
  },

  async create(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*')
      .single();
    if (error) throw error;
    return new KichThuoc(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('makichthuoc', Number(id))
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new KichThuoc(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('makichthuoc', Number(id))
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new KichThuoc(data) : null;
  },
};

module.exports = KichThuocRepository;
