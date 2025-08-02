const { createClient } = require('@supabase/supabase-js');
const SanPham = require('../models/sanpham.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const SanPhamRepository = {
  async getAll() {
    const { data, error } = await supabase.from('sanpham').select('*');
    if (error) return [];
    return data.map(item => new SanPham(item));
  },

  async getById(masanpham) {
    const { data, error } = await supabase
      .from('sanpham')
      .select('*')
      .eq('masanpham', masanpham)
      .single();

    if (error || !data) return null;
    return new SanPham(data);
  },

  async create(sanPhamData) {
    const { data, error } = await supabase
      .from('sanpham')
      .insert([sanPhamData])
      .single();

    if (error || !data) return null;
    return new SanPham(data);
  },

  async update(masanpham, fields) {
    const { data, error } = await supabase
      .from('sanpham')
      .update(fields)
      .eq('masanpham', masanpham)
      .single();

    if (error || !data) return null;
    return new SanPham(data);
  },

  async delete(masanpham) {
    const { data, error } = await supabase
      .from('sanpham')
      .delete()
      .eq('masanpham', masanpham)
      .single();

    if (error || !data) return null;
    return new SanPham(data);
  },

  // 🔍 Tìm theo danh mục
  async findByDanhMuc(madanhmuc) {
    const { data, error } = await supabase
      .from('sanpham')
      .select('*')
      .eq('madanhmuc', madanhmuc);

    if (error) return [];
    return data.map(item => new SanPham(item));
  },

  // 🔍 Tìm theo thương hiệu
  async findByThuongHieu(mathuonghieu) {
    const { data, error } = await supabase
      .from('sanpham')
      .select('*')
      .eq('mathuonghieu', mathuonghieu);

    if (error) return [];
    return data.map(item => new SanPham(item));
  },

  // 🔍 Tìm theo trạng thái
  async findByTrangThai(trangthai) {
    const { data, error } = await supabase
      .from('sanpham')
      .select('*')
      .eq('trangthai', trangthai);

    if (error) return [];
    return data.map(item => new SanPham(item));
  }
};

module.exports = SanPhamRepository;