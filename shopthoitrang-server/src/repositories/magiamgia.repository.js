const { createClient } = require('@supabase/supabase-js');
const MaGiamGia = require('../models/magiamgia.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const MaGiamGiaRepository = {
  async getAll() {
    const { data, error } = await supabase.from('magiamgia').select('*');
    if (error) return [];
    return data.map(row => new MaGiamGia(row));
  },

  async getById(maVoucher) {
    const { data, error } = await supabase
      .from('magiamgia')
      .select('*')
      .eq('mavoucher', maVoucher)
      .single();
    if (error || !data) return null;
    return new MaGiamGia(data);
  },

  async create(voucher) {
    const { data, error } = await supabase.from('magiamgia').insert([voucher]).single();
    if (error) return null;
    return new MaGiamGia(data);
  },

  async update(maVoucher, fields) {
    const { data, error } = await supabase
      .from('magiamgia')
      .update(fields)
      .eq('mavoucher', maVoucher)
      .single();
    if (error || !data) return null;
    return new MaGiamGia(data);
  },

  async delete(maVoucher) {
    const { data, error } = await supabase
      .from('magiamgia')
      .delete()
      .eq('mavoucher', maVoucher)
      .single();
    if (error || !data) return null;
    return new MaGiamGia(data);
  }
};

module.exports = MaGiamGiaRepository;