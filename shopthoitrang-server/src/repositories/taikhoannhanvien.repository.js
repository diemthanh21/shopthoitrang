// repositories/taikhoannhanvien.repository.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TaiKhoanNhanVienRepository = {
  async findByCredentials(tenDangNhap, matKhau) {
    const { data, error } = await supabase
      .from('TaiKhoanNhanVien')
      .select('*')
      .eq('TENDANGNHAP', tenDangNhap)
      .eq('MATKHAU', matKhau)
      .eq('DANGHOATDONG', true)
      .single();

    if (error || !data) return null;
    return data;
  }
};

module.exports = TaiKhoanNhanVienRepository;
