const { createClient } = require('@supabase/supabase-js');
const NoiDungChat = require('../models/noidungchat.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const NoiDungChatRepository = {
  async getAll() {
    const { data, error } = await supabase.from('noidungchat').select('*');
    if (error) return [];
    return data.map(row => new NoiDungChat(row));
  },

  async getById(maChat) {
    const { data, error } = await supabase.from('noidungchat').select('*').eq('machat', maChat).single();
    if (error || !data) return null;
    return new NoiDungChat(data);
  },

  async getByChatBox(maChatBox) {
    const { data, error } = await supabase.from('noidungchat').select('*').eq('machatbox', maChatBox);
    if (error) return [];
    return data.map(row => new NoiDungChat(row));
  },

  async create(obj) {
    const { data, error } = await supabase.from('noidungchat').insert([obj]).single();
    if (error) return null;
    return new NoiDungChat(data);
  },

  async update(maChat, fields) {
    const { data, error } = await supabase.from('noidungchat').update(fields).eq('machat', maChat).single();
    if (error || !data) return null;
    return new NoiDungChat(data);
  },

  async delete(maChat) {
    const { data, error } = await supabase.from('noidungchat').delete().eq('machat', maChat).single();
    if (error || !data) return null;
    return new NoiDungChat(data);
  }
};

module.exports = NoiDungChatRepository;
