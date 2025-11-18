const { createClient } = require('@supabase/supabase-js');
const ChiTietPhieuDatHang = require('../models/chitietphieudathang.model');

const supabase = require('../../config/db');
const TABLE = 'chitietphieudathang';

let chatLieuSupported = true;

const stripChatLieu = (payload) => {
  if (!payload || chatLieuSupported || payload.chatlieu === undefined) return payload;
  const clone = { ...payload };
  delete clone.chatlieu;
  return clone;
};

const shouldRetryWithoutChatLieu = (error) => {
  const message = error?.message?.toLowerCase?.() ?? "";
  if (
    message.includes("chatlieu") ||
    message.includes("'chatlieu' column") ||
    message.includes('column "chatlieu"')
  ) {
    chatLieuSupported = false;
    console.warn(
      "[chitietphieudathang] Column 'chatlieu' is missing. Skipping this field until the database migration is applied."
    );
    return true;
  }
  return false;
};

const ChiTietPhieuDatHangRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('machitietphieudathang', { ascending: true });
    if (error) throw error;
    return data.map(row => new ChiTietPhieuDatHang(row));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('machitietphieudathang', id).single();
    if (error || !data) return null;
    return new ChiTietPhieuDatHang(data);
  },

  async create(entity) {
    let payload = chatLieuSupported ? entity : stripChatLieu(entity);

    let { data, error } = await supabase.from(TABLE).insert([payload]).select().single();

    if (error && chatLieuSupported && shouldRetryWithoutChatLieu(error)) {
      payload = stripChatLieu(entity);
      ({ data, error } = await supabase.from(TABLE).insert([payload]).select().single());
    }

    if (error) throw error;
    return new ChiTietPhieuDatHang(data);
  },

  async update(id, fields) {
    let payload = chatLieuSupported ? fields : stripChatLieu(fields);

    let { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('machitietphieudathang', id)
      .select()
      .single();

    if (error && chatLieuSupported && shouldRetryWithoutChatLieu(error)) {
      payload = stripChatLieu(fields);
      ({ data, error } = await supabase
        .from(TABLE)
        .update(payload)
        .eq('machitietphieudathang', id)
        .select()
        .single());
    }

    if (error || !data) return null;
    return new ChiTietPhieuDatHang(data);
  },

  async delete(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('machitietphieudathang', id).select().single();
    if (error || !data) return null;
    return new ChiTietPhieuDatHang(data);
  }
};

module.exports = ChiTietPhieuDatHangRepository;
