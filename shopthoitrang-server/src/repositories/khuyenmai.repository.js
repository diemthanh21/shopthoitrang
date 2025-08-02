const { createClient } = require('@supabase/supabase-js');
const KhuyenMai = require('../models/khuyenmai.model');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const KhuyenMaiRepository = {
  async getAll() {
    const { data, error } = await supabase.from('khuyenmai').select('*');
    if (error) return [];
    return data.map(row => new KhuyenMai(row));
  },

  async getById(ma) {
    const { data, error } = await supabase
      .from('khuyenmai')
      .select('*')
      .eq('makhuyenmai', ma)
      .single();
    if (error || !data) return null;
    return new KhuyenMai(data);
  },

  async getBySanPham(maSP) {
    const { data, error } = await supabase
      .from('khuyenmai')
      .select('*')
      .eq('masanpham', maSP);
    if (error) return [];
    return data.map(row => new KhuyenMai(row));
  },

  async create(data) {
    const { data: inserted, error } = await supabase
      .from('khuyenmai')
      .insert([data])
      .single();
    if (error) return null;
    return new KhuyenMai(inserted);
  },

  async update(ma, fields) {
    const { data, error } = await supabase
      .from('khuyenmai')
      .update(fields)
      .eq('makhuyenmai', ma)
      .single();
    if (error || !data) return null;
    return new KhuyenMai(data);
  },

  async delete(ma) {
    const { data, error } = await supabase
      .from('khuyenmai')
      .delete()
      .eq('makhuyenmai', ma)
      .single();
    if (error || !data) return null;
    return new KhuyenMai(data);
  }
};

module.exports = KhuyenMaiRepository;
