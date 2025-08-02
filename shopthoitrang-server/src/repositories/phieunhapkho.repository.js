const { createClient } = require('@supabase/supabase-js');
const PhieuNhapKho = require('../models/phieunhapkho.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const PhieuNhapKhoRepository = {
  async getAll() {
    const { data, error } = await supabase.from('phieunhapkho').select('*');
    if (error) return [];
    return data.map(row => new PhieuNhapKho(row));
  },

  async getById(ma) {
    const { data, error } = await supabase
      .from('phieunhapkho')
      .select('*')
      .eq('maphieunhap', ma)
      .single();
    if (error || !data) return null;
    return new PhieuNhapKho(data);
  },

  async findByNhanVien(maNV) {
    const { data, error } = await supabase
      .from('phieunhapkho')
      .select('*')
      .eq('manhanvien', maNV);
    if (error) return [];
    return data.map(row => new PhieuNhapKho(row));
  },

  async findByNhaCungCap(maNCC) {
    const { data, error } = await supabase
      .from('phieunhapkho')
      .select('*')
      .eq('manhacungcap', maNCC);
    if (error) return [];
    return data.map(row => new PhieuNhapKho(row));
  },

  async findByNgayNhap(date) {
    const { data, error } = await supabase
      .from('phieunhapkho')
      .select('*')
      .eq('ngaynhap', date);
    if (error) return [];
    return data.map(row => new PhieuNhapKho(row));
  },

  async create(obj) {
    const { data, error } = await supabase
      .from('phieunhapkho')
      .insert([obj])
      .single();
    if (error) return null;
    return new PhieuNhapKho(data);
  },

  async update(ma, fields) {
    const { data, error } = await supabase
      .from('phieunhapkho')
      .update(fields)
      .eq('maphieunhap', ma)
      .single();
    if (error || !data) return null;
    return new PhieuNhapKho(data);
  },

  async delete(ma) {
    const { error } = await supabase
      .from('phieunhapkho')
      .delete()
      .eq('maphieunhap', ma);
    return !error;
  }
};

module.exports = PhieuNhapKhoRepository;
