const { createClient } = require('@supabase/supabase-js');
const SanPham = require('../models/sanpham.model');

const supabase = require('../../config/db');
const TABLE = 'sanpham';
const CTSP_TABLE = 'chitietsanpham';
const ORDER_DETAIL_TABLE = 'chitietdonhang';
const ORDER_TABLE = 'donhang';
const RETURN_TABLE = 'trahang';
const EXCHANGE_TABLE = 'doihang';

// Trạng thái đơn hàng dùng để tính tồn / đã bán
// - SUCCESS_ORDER_STATUSES: các trạng thái được xem là đã bán thật sự
// - CANCEL_ORDER_STATUSES: các trạng thái bị hủy, không giữ hàng
// - Các trạng thái còn lại (không hủy, không cart) sẽ được coi là đang giữ hàng (đã trừ tồn tạm thời)
const SUCCESS_ORDER_STATUSES = new Set([
  'da giao',
  'da hoan thanh',
  'hoan thanh',
  'completed',
  'done'
]);
const CANCEL_ORDER_STATUSES = new Set([
  'da huy',
  'huy',
  'cancelled',
  'cancel'
]);
const RETURN_SUCCESS_STATUSES = new Set([
  'da xu ly',
  'da hoan tien',
  'da_duyet_- cho gui hang',
  'da hoan tien'
]);
const EXCHANGE_SUCCESS_STATUSES = new Set([
  'da doi xong'
]);

const normalizeStatus = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const SanPhamRepository = {
  async getAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.tensanpham) query = query.ilike('tensanpham', `%${filters.tensanpham}%`);
    if (filters.madanhmuc) query = query.eq('madanhmuc', filters.madanhmuc);
    if (filters.mathuonghieu) query = query.eq('mathuonghieu', filters.mathuonghieu);
    if (filters.trangthai) query = query.eq('trangthai', filters.trangthai);

    const { data, error } = await query.order('masanpham', { ascending: true });
    if (error) throw error;
    return data.map(r => new SanPham(r));
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('masanpham', id).maybeSingle();
    if (error) throw error;
    return data ? new SanPham(data) : null;
  },

  async count() {
    const { count, error } = await supabase
      .from(TABLE)
      .select('masanpham', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new SanPham(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('masanpham', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new SanPham(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('masanpham', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? new SanPham(data) : null;
  },

  async getNamesByIds(ids = []) {
    const uniqueIds = [...new Set((ids || []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];
    if (!uniqueIds.length) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select('masanpham, tensanpham')
      .in('masanpham', uniqueIds);
    if (error) throw error;
    return data || [];
  },

  async getStats(productId) {
    const { data: variantRows, error: variantErr } = await supabase
      .from(CTSP_TABLE)
      .select('machitietsanpham')
      .eq('masanpham', productId);
    if (variantErr) throw variantErr;
    const variantIds = (variantRows || []).map((row) => row.machitietsanpham).filter(Boolean);
    if (!variantIds.length) {
      return { sold: 0, stock: 0 };
    }

    const { data: sizeRows, error: sizeErr } = await supabase
      .from('chitietsanpham_kichthuoc')
      .select('machitietsanpham, so_luong')
      .in('machitietsanpham', variantIds);
    if (sizeErr) throw sizeErr;
    const currentStock = (sizeRows || []).reduce(
      (sum, row) => sum + (Number(row?.so_luong) || 0),
      0
    );

    const { data: orderDetails, error: orderDetailErr } = await supabase
      .from(ORDER_DETAIL_TABLE)
      .select('madonhang, machitietsanpham, soluong')
      .in('machitietsanpham', variantIds);
    if (orderDetailErr) throw orderDetailErr;

    const orderIds = [...new Set((orderDetails || []).map((item) => item.madonhang).filter(Boolean))];
    let ordersMap = new Map();
    if (orderIds.length) {
      const { data: orders, error: orderErr } = await supabase
        .from(ORDER_TABLE)
        .select('madonhang, trangthaidonhang')
        .in('madonhang', orderIds);
      if (orderErr) throw orderErr;
      ordersMap = new Map(
        (orders || []).map((order) => [order.madonhang, order.trangthaidonhang])
      );
    }

    let sold = 0;
    let reserved = 0;
    (orderDetails || []).forEach((detail) => {
      const qty = Number(detail?.soluong) || 0;
      const status = normalizeStatus(ordersMap.get(detail.madonhang));

      // 1) sold: chỉ tính các đơn đã giao / hoàn thành (đúng nghĩa đã bán)
      if (SUCCESS_ORDER_STATUSES.has(status)) {
        sold += qty;
      } else if (CANCEL_ORDER_STATUSES.has(status)) {
        // Nếu đã hủy mà trước đó từng tính sold, ta trừ lại.
        sold -= qty;
      }

      // 2) reserved: mọi đơn KHÔNG bị hủy, KHÔNG phải cart đều đang giữ hàng
      if (!CANCEL_ORDER_STATUSES.has(status) && status !== 'cart') {
        reserved += qty;
      }
    });

    const { data: returns, error: returnErr } = await supabase
      .from(RETURN_TABLE)
      .select('machitietsanpham, soluong, trangthai')
      .in('machitietsanpham', variantIds);
    if (returnErr) throw returnErr;
    (returns || []).forEach((item) => {
      const qty = Number(item?.soluong) || 0;
      const status = normalizeStatus(item?.trangthai);
      if (RETURN_SUCCESS_STATUSES.has(status)) {
        // Hoàn tiền / trả hàng thành công: giảm số đã bán và giải phóng hàng đã giữ
        sold -= qty;
        reserved -= qty;
      }
    });

    const { data: exchanges, error: exchangeErr } = await supabase
      .from(EXCHANGE_TABLE)
      .select('machitietsanphamcu, soluong, trangthai')
      .in('machitietsanphamcu', variantIds);
    if (exchangeErr) throw exchangeErr;
    (exchanges || []).forEach((item) => {
      const qty = Number(item?.soluong) || 0;
      const status = normalizeStatus(item?.trangthai);
      if (EXCHANGE_SUCCESS_STATUSES.has(status)) {
        // Đổi hàng xong: coi như đã trả lại hàng cũ, nên giảm sold và reserved
        sold -= qty;
        reserved -= qty;
      }
    });

    if (sold < 0) sold = 0;
    if (reserved < 0) reserved = 0;

    // Tồn khả dụng cho bán = tồn vật lý hiện tại - số lượng đang bị giữ (đơn chưa hủy)
    const availableStock = Math.max(0, currentStock - reserved);

    return {
      sold,
      stock: availableStock
    };
  }
};

module.exports = SanPhamRepository;
