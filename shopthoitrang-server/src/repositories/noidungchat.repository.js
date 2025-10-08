const { createClient } = require('@supabase/supabase-js');
const NoiDungChat = require('../models/noidungchat.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'noidungchat';

const NoiDungChatRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.machatbox) query = query.eq('machatbox', filters.machatbox);
    if (filters.nguoigui) query = query.eq('nguoigui', filters.nguoigui);
    if (filters.daxem === 'true') query = query.eq('daxem', true);
    if (filters.daxem === 'false') query = query.eq('daxem', false);
    if (filters.from) query = query.gte('thoigiangui', filters.from); // ISO
    if (filters.to) query = query.lte('thoigiangui', filters.to);

    const { data, error } = await query.order('thoigiangui', { ascending: true });
    if (error) throw error;
    return data.map(r => new NoiDungChat(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('machat', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new NoiDungChat(data) : null;
  },

  async getByChatBox(machatbox) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('machatbox', machatbox)
      .order('thoigiangui', { ascending: true });
    if (error) throw error;
    return data.map(r => new NoiDungChat(r));
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new NoiDungChat(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('machat', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new NoiDungChat(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('machat', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new NoiDungChat(data) : null;
  }
};

module.exports = NoiDungChatRepository;
