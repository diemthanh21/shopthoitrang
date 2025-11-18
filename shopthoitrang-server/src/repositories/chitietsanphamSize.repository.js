const supabase = require('../../config/db');

const TABLE = 'chitietsanpham_kichthuoc';
const SIZE_SELECT = `
  id,
  machitietsanpham,
  makichthuoc,
  so_luong,
  kichthuocs (
    makichthuoc,
    ten_kichthuoc,
    mo_ta
  )
`;

const ChiTietSanPhamSizeRepository = {
  async listByVariant(variantId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SIZE_SELECT)
      .eq('machitietsanpham', Number(variantId))
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async replaceForVariant(variantId, rows) {
    const vid = Number(variantId);
    const { error: delErr } = await supabase
      .from(TABLE)
      .delete()
      .eq('machitietsanpham', vid);
    if (delErr) throw delErr;

    if (!rows.length) return [];

    const payload = rows.map((row) => ({
      machitietsanpham: vid,
      makichthuoc: Number(row.makichthuoc),
      so_luong: Number(row.so_luong ?? 0),
    }));

    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select(SIZE_SELECT);
    if (error) throw error;
    return data || [];
  },
};

module.exports = ChiTietSanPhamSizeRepository;
