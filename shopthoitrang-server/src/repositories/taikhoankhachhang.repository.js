const { createClient } = require('@supabase/supabase-js');
const TaiKhoanKhachHang = require('../models/taikhoankhachhang.model');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TaiKhoanKhachHangRepository = {
  // 🔐 Đăng nhập
  async findByCredentials(tendangnhap, pass) {
    const { data, error } = await supabase
      .from('taikhoankhachhang')
      .select('*')
      .eq('tendangnhap', tendangnhap)
      .eq('pass', pass)
      .eq('danghoatdong', true)
      .single();

    if (error || !data) return null;
    return new TaiKhoanKhachHang(data);
  },

  // ✅ Tạo mới (Đăng ký)
  async create(taiKhoan) {
    const { data, error } = await supabase
      .from('taikhoankhachhang')
      .insert([taiKhoan])
      .single();

    if (error) return null;
    return new TaiKhoanKhachHang(data);
  },

  // 📥 Lấy toàn bộ
  async getAll() {
    const { data, error } = await supabase
      .from('taikhoankhachhang')
      .select('*');

    if (error) return [];
    return data.map(row => new TaiKhoanKhachHang(row));
  },

  // 🔍 Lấy theo ID
  async getById(makhachhang) {
    const { data, error } = await supabase
      .from('taikhoankhachhang')
      .select('*')
      .eq('makhachhang', makhachhang)
      .single();

    if (error || !data) return null;
    return new TaiKhoanKhachHang(data);
  },

  // ✏️ Cập nhật
  async update(makhachhang, updatedFields) {
    const { data, error } = await supabase
      .from('taikhoankhachhang')
      .update(updatedFields)
      .eq('makhachhang', makhachhang)
      .single();

    if (error || !data) return null;
    return new TaiKhoanKhachHang(data);
  },

  // 🗑️ Xoá (mềm)
  async delete(makhachhang) {
    const { data, error } = await supabase
      .from('taikhoankhachhang')
      .update({ danghoatdong: false }) // xoá mềm
      .eq('makhachhang', makhachhang)
      .single();

    if (error || !data) return null;
    return new TaiKhoanKhachHang(data);
  }
};

module.exports = TaiKhoanKhachHangRepository;