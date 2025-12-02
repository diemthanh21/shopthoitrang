// services/catalog.service.js
const supabase = require('../../config/db');

class CatalogService {
  /**
   * orderBy: 'category' | 'price' | 'rating' | undefined
   * sort: 'asc' | 'desc' (default: 'asc')
   */
  async listProducts({
    categoryName,
    minPrice,
    maxPrice,
    onlyFiveStar,
    orderBy,   // 'category' | 'price' | 'rating'
    sort = 'asc',
    limit = 20,
    offset = 0,
  }) {
    // 1) Base ids theo sanpham, lọc danh mục (theo tên)
    let spQuery = supabase
      .from('sanpham')
      .select('masanpham, madanhmuc')
      .order('masanpham', { ascending: true });

    let catMap = new Map(); // madanhmuc -> tendanhmuc (để sort theo category)
    if (categoryName && categoryName.trim()) {
      const { data: catData, error: catErr } = await supabase
        .from('danhmucsanpham')
        .select('madanhmuc, tendanhmuc')
        .ilike('tendanhmuc', `%${categoryName.trim()}%`);
      if (catErr) throw catErr;
      const catIds = (catData || []).map(c => c.madanhmuc);
      if (catIds.length === 0) return [];
      // Build map danh mục (phục vụ sort category)
      catMap = new Map(catData.map(c => [c.madanhmuc, c.tendanhmuc]));
      spQuery = spQuery.in('madanhmuc', catIds);
    } else {
      // nếu không lọc theo tên danh mục, vẫn lấy toàn bộ danh mục để sort
      const { data: dmAll, error: dmErr } = await supabase
        .from('danhmucsanpham')
        .select('madanhmuc, tendanhmuc');
      if (!dmErr && Array.isArray(dmAll)) {
        catMap = new Map(dmAll.map(c => [c.madanhmuc, c.tendanhmuc]));
      }
    }

    const { data: spData, error: spErr } = await spQuery;
    if (spErr) throw spErr;
    let spIds = (spData || []).map(s => s.masanpham);
    const spIdToCatId = new Map((spData || []).map(s => [s.masanpham, s.madanhmuc]));
    if (spIds.length === 0) return [];

    // 2) Lọc theo giá (dựa chitietsanpham)
    if (minPrice != null || maxPrice != null) {
      let ctQuery = supabase.from('chitietsanpham').select('masanpham, giaban');
      if (minPrice != null) ctQuery = ctQuery.gte('giaban', Number(minPrice));
      if (maxPrice != null) ctQuery = ctQuery.lte('giaban', Number(maxPrice));
      const { data: ctData, error: ctErr } = await ctQuery;
      if (ctErr) throw ctErr;
      const allowByPrice = new Set((ctData || []).map(c => c.masanpham));
      spIds = spIds.filter(id => allowByPrice.has(id));
      if (spIds.length === 0) return [];
    }

    // 3) Lọc onlyFiveStar (ít nhất 1 đánh giá 5)
    if (onlyFiveStar) {
      const { data: dgData, error: dgErr } = await supabase
        .from('danhgia')
        .select('masanpham, diemdanhgia')
        .eq('diemdanhgia', 5);
      if (dgErr) throw dgErr;
      const allowBy5 = new Set((dgData || []).map(d => d.masanpham));
      spIds = spIds.filter(id => allowBy5.has(id));
      if (spIds.length === 0) return [];
    }

    // ======= Chuẩn bị dữ liệu sort theo orderBy =======
    const asc = (sort || 'asc').toLowerCase() !== 'desc';

    // Map giá: masanpham -> min(giaban) (để sort theo "giá rẻ nhất")
    let priceMap = new Map();
    if (orderBy === 'price') {
      const { data: priceRows, error: priceErr } = await supabase
        .from('chitietsanpham')
        .select('masanpham, giaban');
      if (priceErr) throw priceErr;
      for (const r of priceRows || []) {
        const id = r.masanpham;
        const v = Number(r.giaban);
        if (!priceMap.has(id)) priceMap.set(id, v);
        else priceMap.set(id, Math.min(priceMap.get(id), v));
      }
    }

    // Map rating: masanpham -> avg(diemdanhgia)
    let ratingMap = new Map();
    if (orderBy === 'rating') {
      const { data: dgRows, error: dgErr } = await supabase
        .from('danhgia')
        .select('masanpham, diemdanhgia');
      if (dgErr) throw dgErr;
      const sumMap = new Map();
      const cntMap = new Map();
      for (const r of dgRows || []) {
        const id = r.masanpham;
        const v = Number(r.diemdanhgia);
        sumMap.set(id, (sumMap.get(id) || 0) + v);
        cntMap.set(id, (cntMap.get(id) || 0) + 1);
      }
      for (const id of sumMap.keys()) {
        ratingMap.set(id, sumMap.get(id) / cntMap.get(id));
      }
    }

    // 4) Sort spIds theo orderBy
    spIds.sort((a, b) => {
      let cmp = 0;
      if (orderBy === 'category') {
        const ca = catMap.get(spIdToCatId.get(a)) || '';
        const cb = catMap.get(spIdToCatId.get(b)) || '';
        cmp = String(ca).localeCompare(String(cb), 'vi', { sensitivity: 'base' });
      } else if (orderBy === 'price') {
        const pa = priceMap.get(a);
        const pb = priceMap.get(b);
        // undefined đẩy về cuối
        if (pa == null && pb == null) cmp = 0;
        else if (pa == null) cmp = 1;
        else if (pb == null) cmp = -1;
        else cmp = pa - pb;
      } else if (orderBy === 'rating') {
        const ra = ratingMap.get(a);
        const rb = ratingMap.get(b);
        if (ra == null && rb == null) cmp = 0;
        else if (ra == null) cmp = -1;
        else if (rb == null) cmp = 1;
        else cmp = ra - rb;
      } else {
        // mặc định theo mã sp
        cmp = (a ?? 0) - (b ?? 0);
      }
      return asc ? cmp : -cmp;
    });

    // 5) Paginate theo thứ tự đã sort
    const idsPage = spIds.slice(offset, offset + limit);
    if (idsPage.length === 0) return [];

    // 6) Lấy rows trả về
    const { data: pageRows, error: pageErr } = await supabase
      .from('sanpham')
      .select('*')
      .in('masanpham', idsPage);
    if (pageErr) throw pageErr;

    // đảm bảo đúng thứ tự idsPage
    const byId = new Map((pageRows || []).map(r => [r.masanpham, r]));
    return idsPage.map(id => byId.get(id)).filter(Boolean);
  }

  async countProducts({ categoryName, minPrice, maxPrice, onlyFiveStar }) {
    const minNumeric =
      minPrice !== undefined && minPrice !== null
        ? Number(minPrice)
        : undefined;
    const maxNumeric =
      maxPrice !== undefined && maxPrice !== null
        ? Number(maxPrice)
        : undefined;
    // Reuse filtering without limit/offset to compute count efficiently
    let spQuery = supabase.from('sanpham').select('masanpham');
    if (categoryName && categoryName.trim()) {
      const { data: catData, error: catErr } = await supabase
        .from('danhmucsanpham')
        .select('madanhmuc')
        .ilike('tendanhmuc', `%${categoryName}%`);
      if (catErr) throw catErr;
      const catIds = (catData || []).map((c) => c.madanhmuc);
      if (catIds.length === 0) return 0;
      spQuery = spQuery.in('madanhmuc', catIds);
    }
    const { data: spData, error: spErr } = await spQuery;
    if (spErr) throw spErr;
    let spIds = (spData || []).map((s) => s.masanpham);
    if (spIds.length === 0) return 0;

    if (minNumeric != null || maxNumeric != null) {
      let ctQuery = supabase.from('chitietsanpham').select('masanpham, giaban');
      if (minNumeric != null) ctQuery = ctQuery.gte('giaban', minNumeric);
      if (maxNumeric != null) ctQuery = ctQuery.lte('giaban', maxNumeric);
      const { data: ctData, error: ctErr } = await ctQuery;
      if (ctErr) throw ctErr;
      const spIdsByPrice = new Set((ctData || []).map((c) => c.masanpham));
      spIds = spIds.filter((id) => spIdsByPrice.has(id));
      if (spIds.length === 0) return 0;
    }

    if (onlyFiveStar) {
      const { data: dgData, error: dgErr } = await supabase
        .from('danhgia')
        .select('masanpham, diemdanhgia')
        .eq('diemdanhgia', 5);
      if (dgErr) throw dgErr;
      const spIdsBy5 = new Set((dgData || []).map((d) => d.masanpham));
      spIds = spIds.filter((id) => spIdsBy5.has(id));
      if (spIds.length === 0) return 0;
    }

    return spIds.length;
  }
}

module.exports = new CatalogService();
