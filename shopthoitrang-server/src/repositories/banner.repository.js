const { createClient } = require('@supabase/supabase-js');
const Banner = require('../models/banner.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'banner';

const BannerRepository = {
  async getAll({ search, active, limit = 50, offset = 0, orderBy = 'thutuhienthi', orderDir = 'asc' } = {}) {
    let q = supabase.from(TABLE).select('*', { count: 'exact' });

    if (search && search.trim()) {
      // tìm theo mô tả hoặc link
      q = q.or(`mota.ilike.%${search}%,lienket.ilike.%${search}%`);
    }
    if (typeof active === 'boolean') {
      q = q.eq('danghoatdong', active);
    }

    q = q
      .order(orderBy || 'thutuhienthi', { ascending: (orderDir || 'asc').toLowerCase() !== 'desc' })
      .order('mabanner', { ascending: true }) // thứ tự phụ
      .range(offset, offset + limit - 1);

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      items: (data || []).map((r) => new Banner(r)),
      total: count ?? 0,
    };
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('mabanner', id).maybeSingle();
    if (error) throw error;
    return data ? new Banner(data) : null;
    // lưu ý: PostgREST mã NOT FOUND khác nhau theo phiên bản, dùng maybeSingle() an toàn hơn.
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new Banner(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('mabanner', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new Banner(data) : null;
  },

  async remove(id) {
    const { error, count } = await supabase.from(TABLE).delete({ count: 'exact' }).eq('mabanner', id);
    if (error) throw error;
    return (count ?? 0) > 0;
  },
};

module.exports = BannerRepository;
