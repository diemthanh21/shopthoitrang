// repository/nhanvien.repository.js
const supabase = require('@supabase/supabase-js').createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TABLE_NAME = 'nhanvien'; // tên bảng trong Supabase

const NhanVienRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE_NAME).select('*');
    if (error) throw new Error(error.message);
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE_NAME)
      .select('*').eq('MANHANVIEN', id).single();
    if (error) throw new Error(error.message);
    return data;
  },

  async create(nhanVienData) {
    const { data, error } = await supabase.from(TABLE_NAME).insert(nhanVienData).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id, nhanVienData) {
    const { data, error } = await supabase.from(TABLE_NAME)
      .update(nhanVienData).eq('MANHANVIEN', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async remove(id) {
    const { error } = await supabase.from(TABLE_NAME)
      .delete().eq('MANHANVIEN', id);
    if (error) throw new Error(error.message);
    return true;
  }
};

module.exports = NhanVienRepository;
