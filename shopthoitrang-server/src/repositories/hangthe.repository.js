const { createClient } = require('@supabase/supabase-js');
const HangThe = require('../models/hangthe.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'hangthe';

const HangTheRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('mahangthe', { ascending: true });
    if (error) throw error;
    return data.map(r => new HangThe(r));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('mahangthe', id).maybeSingle();
    if (error) throw error;
    return data ? new HangThe(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new HangThe(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('mahangthe', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new HangThe(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('mahangthe', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new HangThe(data) : null;
  },
};

module.exports = HangTheRepository;
