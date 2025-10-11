const { createClient } = require('@supabase/supabase-js');
const ChatBox = require('../models/chatbox.model');

const supabase = require('../../config/db');
const TABLE = 'chatbox';

const ChatBoxRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('machatbox', { ascending: true });
    if (error) throw error;
    return data.map(row => new ChatBox(row));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('machatbox', id).single();
    if (error || !data) return null;
    return new ChatBox(data);
  },

  async create(entity) {
    const { data, error } = await supabase.from(TABLE).insert([entity]).select().single();
    if (error) throw error;
    return new ChatBox(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('machatbox', id).select().single();
    if (error || !data) return null;
    return new ChatBox(data);
  },

  async delete(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('machatbox', id).select().single();
    if (error || !data) return null;
    return new ChatBox(data);
  }
};

module.exports = ChatBoxRepository;
