const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[dashboard] Missing SUPABASE_URL or SUPABASE_KEY env vars. Dashboard data will be zeroed.');
}

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

// Định nghĩa bảng & cột chính (có thể chỉnh nếu schema khác)
const TABLES = {
  ORDERS: 'donhang',
  CUSTOMERS: 'taikhoankhachhang',
  PRODUCTS: 'sanpham'
};

// Các khả năng tên cột tổng tiền trong đơn hàng (ưu tiên theo thứ tự)
const ORDER_TOTAL_CANDIDATES = ['thanhtien', 'tongtien', 'total', 'amount'];
// Cột trạng thái (nếu không tồn tại sẽ bỏ lọc)
const ORDER_STATUS_CANDIDATES = ['trangthaidonhang', 'trangthai', 'status'];
const COMPLETED_VALUES = ['hoanthanh', 'completed', 'done', 'đã giao', 'da giao', 'delivered'];
const REFUND_DONE_VALUES = ['hoàn tiền thành công', 'da hoan tien', 'đã hoàn tiền', 'hoan tien thanh cong'];

// Cột thời gian tạo đơn (để sort gần nhất) – thử lần lượt
const ORDER_CREATED_CANDIDATES = ['ngaydathang', 'created_at', 'ngaytao', 'createdat'];

// Primary key columns cho mỗi bảng
const ORDER_ID_CANDIDATES = ['madonhang', 'id'];
const CUSTOMER_ID_CANDIDATES = ['makhachhang', 'id'];
const PRODUCT_ID_CANDIDATES = ['masanpham', 'id'];

// Sản phẩm – các khả năng tên cột
const PRODUCT_NAME_CANDIDATES = ['tensanpham', 'name'];
const PRODUCT_PRICE_CANDIDATES = ['giaban', 'price'];
const PRODUCT_SOLD_CANDIDATES = ['daban', 'sold', 'soluongban', 'quantity_sold'];

// Cache kết quả dò cột để không gọi lại nhiều lần
const columnCache = new Map(); // key: table, value: Set(columns)

async function fetchColumns(table) {
  if (columnCache.has(table)) return columnCache.get(table);
  // Lấy 1 dòng bất kỳ để suy ra tên cột (Supabase không có describe table direct)
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) {
    if (error.code === '42P01') {
      console.warn(`[dashboard] Table not found ${table}`);
      columnCache.set(table, new Set());
      return new Set();
    }
    throw error;
  }
  const cols = new Set(data && data.length ? Object.keys(data[0]) : []);
  columnCache.set(table, cols);
  return cols;
}

function pickFirstExisting(columnsSet, candidates) {
  for (const c of candidates) {
    if (columnsSet.has(c)) return c;
  }
  return null;
}

async function resolveOrderColumns() {
  const cols = await fetchColumns(TABLES.ORDERS);
  return {
    totalCol: pickFirstExisting(cols, ORDER_TOTAL_CANDIDATES),
    statusCol: pickFirstExisting(cols, ORDER_STATUS_CANDIDATES),
    createdCol: pickFirstExisting(cols, ORDER_CREATED_CANDIDATES)
  };
}

async function resolveProductColumns() {
  const cols = await fetchColumns(TABLES.PRODUCTS);
  return {
    idCol: pickFirstExisting(cols, PRODUCT_ID_CANDIDATES),
    nameCol: pickFirstExisting(cols, PRODUCT_NAME_CANDIDATES),
    priceCol: pickFirstExisting(cols, PRODUCT_PRICE_CANDIDATES),
    soldCol: pickFirstExisting(cols, PRODUCT_SOLD_CANDIDATES)
  };
}

async function resolveOrderColumns() {
  const cols = await fetchColumns(TABLES.ORDERS);
  return {
    idCol: pickFirstExisting(cols, ORDER_ID_CANDIDATES),
    totalCol: pickFirstExisting(cols, ORDER_TOTAL_CANDIDATES),
    statusCol: pickFirstExisting(cols, ORDER_STATUS_CANDIDATES),
    createdCol: pickFirstExisting(cols, ORDER_CREATED_CANDIDATES)
  };
}

async function sumRevenue() {
  const { totalCol, statusCol } = await resolveOrderColumns();
  if (!totalCol) return 0; // không có cột tổng tiền

  // Chỉ select 2 cột cần thiết để nhẹ hơn
  const selectCols = [totalCol];
  if (statusCol) selectCols.push(statusCol);

  const { data, error } = await supabase
    .from(TABLES.ORDERS)
    .select(selectCols.join(','));
  if (error) {
    if (error.code === '42P01') return 0;
    throw error;
  }
  return (data || [])
    .filter(r => {
      if (!statusCol) return true;
      const v = String(r[statusCol] || '').toLowerCase();
      // Nếu đơn có trạng thái và thuộc nhóm hoàn tất thì tính, nếu không có trạng thái vẫn tính
      return !statusCol || COMPLETED_VALUES.includes(v) || v === '';
    })
    .reduce((sum, r) => sum + (Number(r[totalCol]) || 0), 0);
}

async function countTable(table) {
  try {
    // Xác định cột primary key cho mỗi bảng
    let pkCol = 'id'; // default
    if (table === TABLES.ORDERS) pkCol = 'madonhang';
    else if (table === TABLES.CUSTOMERS) pkCol = 'makhachhang';
    else if (table === TABLES.PRODUCTS) pkCol = 'masanpham';
    
    // Thử select primary key column để đếm
    const { data, error } = await supabase
      .from(table)
      .select(pkCol);
    
    if (error) {
      if (error.code === '42P01') {
        console.warn(`[dashboard] Table not found: ${table}`);
        return 0;
      }
      throw error;
    }
    
    return data ? data.length : 0;
  } catch (e) {
    console.error(`[dashboard] Count error for table ${table}:`, e.message);
    return 0;
  }
}

async function recentOrders(limit = 5) {
  const { idCol, totalCol, statusCol, createdCol } = await resolveOrderColumns();
  if (!totalCol) return [];

  // Chọn cột để select
  const cols = [];
  if (idCol) cols.push(idCol);
  if (createdCol) cols.push(createdCol);
  cols.push(totalCol);
  if (statusCol) cols.push(statusCol);

  // Nếu không có cột created, vẫn trả về các dòng bất kỳ (order by total desc)
  const query = supabase
    .from(TABLES.ORDERS)
    .select(cols.join(','))
    .limit(limit);
  if (createdCol) {
    query.order(createdCol, { ascending: false });
  } else {
    query.order(totalCol, { ascending: false });
  }
  const { data, error } = await query;
  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return (data || []).map((r, idx) => ({
    id: idCol ? r[idCol] : `order-${idx}`,
    total: r[totalCol],
    status: statusCol ? r[statusCol] : null,
    created_at: createdCol ? r[createdCol] : null
  }));
}

async function topProducts(limit = 5) {
  const { idCol, nameCol, priceCol, soldCol } = await resolveProductColumns();
  if (!idCol || !nameCol) return [];

  const selectCols = [idCol, nameCol];
  if (priceCol) selectCols.push(priceCol);
  if (soldCol) selectCols.push(soldCol);

  const query = supabase
    .from(TABLES.PRODUCTS)
    .select(selectCols.join(','))
    .limit(limit);
  if (soldCol) query.order(soldCol, { ascending: false });

  const { data, error } = await query;
  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return (data || []).map(p => ({
    id: p[idCol],
    name: p[nameCol],
    price: priceCol ? p[priceCol] : null,
    sold: soldCol ? p[soldCol] : null
  }));
}

async function summary() {
  // Early return nếu thiếu env Supabase để tránh crash
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[dashboard] Missing Supabase env vars - returning empty dashboard');
    return {
      stats: { revenue: 0, ordersCount: 0, productsCount: 0, customersCount: 0 },
      recentOrders: [],
      topProducts: []
    };
  }

  try {
    const [revenue, ordersCount, productsCount, customersCount, recent, top] = await Promise.all([
      sumRevenue().catch(e => { console.error('[dashboard] revenue', e.message); return 0; }),
      countTable(TABLES.ORDERS).catch(e => { console.error('[dashboard] orders count', e.message); return 0; }),
      countTable(TABLES.PRODUCTS).catch(e => { console.error('[dashboard] products count', e.message); return 0; }),
      countTable(TABLES.CUSTOMERS).catch(e => { console.error('[dashboard] customers count', e.message); return 0; }),
      recentOrders().catch(e => { console.error('[dashboard] recent orders', e.message); return []; }),
      topProducts().catch(e => { console.error('[dashboard] top products', e.message); return []; })
    ]);
    return {
      stats: { revenue, ordersCount, productsCount, customersCount },
      recentOrders: recent,
      topProducts: top
    };
  } catch (err) {
    console.error('[dashboard] summary fatal', err);
    // Trả về rỗng thay vì ném lỗi để controller vẫn trả 200, nếu muốn 500 giữ nguyên throw
    throw err;
  }
}

module.exports = { summary };
/**
 * Revenue Flow: Tổng thu/chi theo khoảng thời gian
 */
function dayStartStr(d) {
  if (!d) return null;
  const m = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : (new Date(d)).toISOString().slice(0,10);
  return `${m}T00:00:00`;
}
function nextDayStartStr(d) {
  if (!d) return null;
  const base = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d);
  if (Number.isNaN(base.getTime())) return null;
  const dt = new Date(base);
  dt.setDate(dt.getDate() + 1);
  return `${dt.toISOString().slice(0,10)}T00:00:00`;
}

async function getRefundedOrderIds() {
  // Trả về Set các madonhang đã hoàn tiền thành công
  try {
    const { data, error } = await supabase
      .from('trahang')
      .select('madonhang, trangthai');
    if (error) throw error;
    const set = new Set();
    (data || []).forEach(r => {
      const st = String(r.trangthai || '').toLowerCase();
      if (REFUND_DONE_VALUES.includes(st) && r.madonhang != null) set.add(r.madonhang);
    });
    return set;
  } catch (e) {
    console.warn('[dashboard] getRefundedOrderIds error', e.message);
    return new Set();
  }
}

async function sumOrdersInflow({ from, to }) {
  const { idCol, totalCol, statusCol, createdCol } = await resolveOrderColumns();
  if (!totalCol) return 0;

  let query = supabase.from(TABLES.ORDERS).select([idCol, totalCol, statusCol, createdCol].filter(Boolean).join(','));
  const startISO = dayStartStr(from);
  const endISO = nextDayStartStr(to);
  if (createdCol) {
    if (startISO) query = query.gte(createdCol, startISO);
    if (endISO) query = query.lt(createdCol, endISO); // end-of-day inclusive
  }
  const { data, error } = await query;
  if (error) throw error;
  const refundedSet = await getRefundedOrderIds();
  return (data || [])
    .filter(r => {
      if (!statusCol) return true;
      const v = String(r[statusCol] || '').toLowerCase();
      const done = COMPLETED_VALUES.includes(v);
      // Loại trừ đơn đã hoàn tiền thành công theo bảng trahang
      const orderId = idCol ? r[idCol] : (r.madonhang || r.id || r.ID);
      const isRefunded = refundedSet.has(orderId);
      return done && !isRefunded;
    })
    .reduce((s, r) => s + (Number(r[totalCol]) || 0), 0);
}

async function sumPurchaseOrdersOutflow({ from, to }) {
  // phieudathang: tongtien, trangthaiphieu, ngaydatphieu
  const table = 'phieudathang';
  const DONE = ['hoàn thành', 'hoan thanh'];
  let query = supabase
    .from(table)
    .select('tongtien, trangthaiphieu, ngaydatphieu');
  const startISO = dayStartStr(from);
  const endISO = nextDayStartStr(to);
  if (startISO) query = query.gte('ngaydatphieu', startISO);
  if (endISO) query = query.lt('ngaydatphieu', endISO);
  const { data, error } = await query;
  if (error && error.code !== '42P01') throw error;
  const rows = (data || []).filter(r => {
    const st = String(r.trangthaiphieu || '').toLowerCase();
    return DONE.includes(st);
  });
  return rows.reduce((s, r) => s + (Number(r.tongtien) || 0), 0);
}

async function revenueFlow({ from, to } = {}) {
  // default: first day of current month -> now
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const period = {
    from: from || start.toISOString().slice(0, 10),
    to: to || now.toISOString().slice(0, 10)
  };

  const inflowTotal = await sumOrdersInflow(period).catch(() => 0);
  const purchaseTotal = await sumPurchaseOrdersOutflow(period).catch(() => 0);
  const outflowTotal = purchaseTotal;

  return {
    period,
    inflow: {
      total: inflowTotal,
      sources: [
        { key: 'sales', label: 'Đơn hàng', amount: inflowTotal }
      ]
    },
    outflow: {
      total: outflowTotal,
      sources: [
        { key: 'purchase-orders', label: 'Phiếu đặt hàng', amount: purchaseTotal }
      ]
    },
    net: inflowTotal - outflowTotal
  };
}

/**
 * Top products (best sellers) within period by quantity sold.
 * Aggregates order details -> variant -> product and computes weighted average price.
 */
async function topProductsByPeriod({ from, to, limit = 5, minSold = 1 } = {}) {
  // Resolve important columns
  const { idCol: orderIdCol, statusCol: orderStatusCol, createdCol: orderCreatedCol } = await resolveOrderColumns();
  const completed = new Set(COMPLETED_VALUES);

  // Default range: current month
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const period = {
    from: from || start.toISOString().slice(0, 10),
    to: to || now.toISOString().slice(0, 10)
  };
  const startISO = dayStartStr(period.from);
  const endISO = nextDayStartStr(period.to);

  // 1) Fetch eligible orders in range
  let orderQuery = supabase.from(TABLES.ORDERS).select([orderIdCol, orderStatusCol, orderCreatedCol].filter(Boolean).join(','));
  if (orderCreatedCol) {
    if (startISO) orderQuery = orderQuery.gte(orderCreatedCol, startISO);
    if (endISO) orderQuery = orderQuery.lt(orderCreatedCol, endISO);
  }
  const { data: orderRows, error: orderErr } = await orderQuery;
  if (orderErr) throw orderErr;

  const refundedSet = await getRefundedOrderIds();
  const orderIds = (orderRows || [])
    .filter((r) => {
      if (!orderStatusCol) return true;
      const v = String(r[orderStatusCol] || '').toLowerCase();
      const done = completed.has(v);
      const oid = orderIdCol ? r[orderIdCol] : r.madonhang;
      return done && !refundedSet.has(oid);
    })
    .map((r) => (orderIdCol ? r[orderIdCol] : r.madonhang))
    .filter((v) => v != null);

  if (orderIds.length === 0) return [];

  // 2) Fetch order details for those orders
  const { data: detailRows, error: detErr } = await supabase
    .from('chitietdonhang')
    .select('madonhang, machitietsanpham, soluong, dongia')
    .in('madonhang', orderIds);
  if (detErr) throw detErr;

  if (!detailRows || detailRows.length === 0) return [];

  // 3) Aggregate by variant id first
  const variantAgg = new Map(); // key: machitietsanpham -> { qty, revenue }
  for (const r of detailRows) {
    const vid = r.machitietsanpham;
    const qty = Number(r.soluong) || 0;
    const price = Number(r.dongia) || 0;
    if (!vid || qty <= 0) continue;
    let obj = variantAgg.get(vid);
    if (!obj) { obj = { qty: 0, revenue: 0 }; variantAgg.set(vid, obj); }
    obj.qty += qty;
    obj.revenue += qty * price;
  }

  if (variantAgg.size === 0) return [];

  const variantIds = Array.from(variantAgg.keys());

  // 4) Map variant -> product id
  const { data: variantRows, error: varErr } = await supabase
    .from('chitietsanpham')
    .select('machitietsanpham, masanpham')
    .in('machitietsanpham', variantIds);
  if (varErr) throw varErr;

  const variantToProduct = new Map();
  (variantRows || []).forEach((r) => {
    if (r.machitietsanpham != null && r.masanpham != null) {
      variantToProduct.set(r.machitietsanpham, r.masanpham);
    }
  });

  // 5) Aggregate by product id
  const productAgg = new Map(); // masanpham -> { qty, revenue }
  for (const [vid, agg] of variantAgg.entries()) {
    const pid = variantToProduct.get(vid);
    if (!pid) continue;
    let p = productAgg.get(pid);
    if (!p) { p = { qty: 0, revenue: 0 }; productAgg.set(pid, p); }
    p.qty += agg.qty;
    p.revenue += agg.revenue;
  }

  if (productAgg.size === 0) return [];

  // 6) Fetch product names
  const productIds = Array.from(productAgg.keys());
  const { data: prodRows, error: prodErr } = await supabase
    .from('sanpham')
    .select('masanpham, tensanpham')
    .in('masanpham', productIds);
  if (prodErr) throw prodErr;

  const nameMap = new Map();
  (prodRows || []).forEach((r) => nameMap.set(r.masanpham, r.tensanpham));

  // 7) Build list and sort
  const items = Array.from(productAgg.entries())
    .map(([pid, v]) => ({
      id: pid,
      name: nameMap.get(pid) || `SP-${pid}`,
      soldCount: v.qty,
      price: v.qty > 0 ? Math.round(v.revenue / v.qty) : 0,
    }))
    .filter((x) => x.soldCount >= minSold)
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, limit);

  return items;
}

module.exports = { summary, revenueFlow, topProductsByPeriod };