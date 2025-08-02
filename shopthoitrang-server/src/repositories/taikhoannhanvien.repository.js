const { createClient } = require('@supabase/supabase-js');
const TaiKhoanNhanVien = require('../models/taikhoannhanvien.model');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TaiKhoanNhanVienRepository = {
  // 🔐 Đăng nhập
  async findByCredentials(tenDangNhap, matKhau) {
    try {
      const { data, error } = await supabase
        .from('taikhoannhanvien')
        .select('*')
        .eq('tendangnhap', tenDangNhap) // ✅ Tên cột chữ thường
        .eq('matkhau', matKhau)         // ✅ Tên cột chữ thường
        .eq('danghoatdong', true)       // ✅ Tên cột chữ thường
        .single();

      if (error) {
        console.error('❌ Lỗi query:', error);
        return null;
      }

      if (!data) {
        console.log('❌ Không tìm thấy user với:', { tenDangNhap, matKhau });
        return null;
      }

      console.log('✅ Tìm thấy user:', data);
      return new TaiKhoanNhanVien(data);
    } catch (err) {
      console.error('❌ Exception:', err);
      return null;
    }
  },

  // ✅ Tạo mới - SỬA LỖI
  async create(taiKhoan) {
    try {
      const { data, error } = await supabase
        .from('taikhoannhanvien')
        .insert([{
          manhanvien: taiKhoan.manhanvien || taiKhoan.MANHANVIEN,
          tendangnhap: taiKhoan.tendangnhap || taiKhoan.TENDANGNHAP,
          matkhau: taiKhoan.matkhau || taiKhoan.MATKHAU,
          danghoatdong: taiKhoan.danghoatdong !== undefined ? taiKhoan.danghoatdong : true
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Lỗi tạo tài khoản:', error);
        return null;
      }

      return new TaiKhoanNhanVien(data);
    } catch (err) {
      console.error('❌ Exception:', err);
      return null;
    }
  },

  // 📥 Lấy tất cả tài khoản nhân viên - SỬA LỖI
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('taikhoannhanvien')
        .select('*');

      if (error) {
        console.error('❌ Lỗi lấy danh sách:', error);
        return [];
      }

      return data.map(row => new TaiKhoanNhanVien(row));
    } catch (err) {
      console.error('❌ Exception:', err);
      return [];
    }
  },

  // 🔍 Lấy theo mã nhân viên - SỬA LỖI
  async getById(maNhanVien) {
    try {
      const { data, error } = await supabase
        .from('taikhoannhanvien')
        .select('*')
        .eq('manhanvien', maNhanVien)
        .single();

      if (error || !data) {
        console.error('❌ Không tìm thấy:', { maNhanVien, error });
        return null;
      }

      return new TaiKhoanNhanVien(data);
    } catch (err) {
      console.error('❌ Exception:', err);
      return null;
    }
  },

  // ✏️ Cập nhật thông tin - SỬA LỖI
  async update(maNhanVien, updatedFields) {
    try {
      // Chuyển đổi tên field về lowercase
      const normalizedFields = {};
      Object.keys(updatedFields).forEach(key => {
        const lowerKey = key.toLowerCase();
        normalizedFields[lowerKey] = updatedFields[key];
      });

      const { data, error } = await supabase
        .from('taikhoannhanvien')
        .update(normalizedFields)
        .eq('manhanvien', maNhanVien)
        .select()
        .single();

      if (error || !data) {
        console.error('❌ Lỗi cập nhật:', error);
        return null;
      }

      return new TaiKhoanNhanVien(data);
    } catch (err) {
      console.error('❌ Exception:', err);
      return null;
    }
  },

  // 🗑️ Xoá mềm (set danghoatdong = false) - SỬA LỖI
  async delete(maNhanVien) {
    try {
      const { data, error } = await supabase
        .from('taikhoannhanvien')
        .update({ danghoatdong: false })
        .eq('manhanvien', maNhanVien)
        .select()
        .single();

      if (error || !data) {
        console.error('❌ Lỗi xóa:', error);
        return null;
      }

      return new TaiKhoanNhanVien(data);
    } catch (err) {
      console.error('❌ Exception:', err);
      return null;
    }
  }
};

module.exports = TaiKhoanNhanVienRepository;