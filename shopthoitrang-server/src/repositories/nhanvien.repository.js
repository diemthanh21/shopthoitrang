const supabase = require('@supabase/supabase-js').createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TABLE_NAME = 'nhanvien'; // tên bảng chữ thường

const NhanVienRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE_NAME).select('*');
    if (error) throw new Error(error.message);
    return data;
  },

  async getById(manhanvien) {
    const { data, error } = await supabase.from(TABLE_NAME)
      .select('*').eq('manhanvien', manhanvien).single();
    if (error) throw new Error(error.message);
    return data;
  },

  async create(nhanVienData) {
    const { data, error } = await supabase.from(TABLE_NAME).insert(nhanVienData).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(manhanvien, nhanVienData) {
    const { data, error } = await supabase.from(TABLE_NAME)
      .update(nhanVienData).eq('manhanvien', manhanvien).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async remove(manhanvien) {
    const { error } = await supabase.from(TABLE_NAME)
      .delete().eq('manhanvien', manhanvien);
    if (error) throw new Error(error.message);
    return true;
  }
};

module.exports = NhanVienRepository;