const { createClient } = require('@supabase/supabase-js');
const ChatBox = require('../models/chatbox.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ChatBoxRepository = {
  async getAll() {
    const { data, error } = await supabase.from('chatbox').select('*');
    if (error) return [];
    return data.map(row => new ChatBox(row));
  },

  async getById(ma) {
    const { data, error } = await supabase
      .from('chatbox')
      .select('*')
      .eq('machatbox', ma)
      .single();
    if (error || !data) return null;
    return new ChatBox(data);
  },

  async findByKhachHang(maKH) {
    const { data, error } = await supabase
      .from('chatbox')
      .select('*')
      .eq('makhachhang', maKH);
    if (error) return [];
    return data.map(row => new ChatBox(row));
  },

  async findByNhanVien(maNV) {
    const { data, error } = await supabase
      .from('chatbox')
      .select('*')
      .eq('manhanvien', maNV);
    if (error) return [];
    return data.map(row => new ChatBox(row));
  },

  async create(obj) {
    const { data, error } = await supabase
      .from('chatbox')
      .insert([obj])
      .single();
    if (error) return null;
    return new ChatBox(data);
  },

  async update(ma, fields) {
    const { data, error } = await supabase
      .from('chatbox')
      .update(fields)
      .eq('machatbox', ma)
      .single();
    if (error || !data) return null;
    return new ChatBox(data);
  },

  async delete(ma) {
    const { error } = await supabase
      .from('chatbox')
      .delete()
      .eq('machatbox', ma);
    return !error;
  }
};

module.exports = ChatBoxRepository;
