const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn('[dashboard] Missing SUPABASE_URL or SUPABASE_KEY env vars. Dashboard data will be zeroed.');
}

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '');

// Định nghĩa bảng & cột chính (có thể chỉnh nếu schema khác)
const TABLES = {
  ORDERS: 'donhang',
  CUSTOMERS: 'taikhoankhachhang',
  PRODUCTS: 'sanpham'
};

// Các khả năng tên cột tổng tiền trong đơn hàng (ưu tiên theo thứ tự)
const ORDER_TOTAL_CANDIDATES = ['tongtien', 'total', 'amount'];
// Cột trạng thái (nếu không tồn tại sẽ bỏ lọc)
const ORDER_STATUS_CANDIDATES = ['trangthai', 'status'];
const COMPLETED_VALUES = ['hoanthanh', 'completed', 'done'];

// Cột thời gian tạo đơn (để sort gần nhất) – thử lần lượt
const ORDER_CREATED_CANDIDATES = ['created_at', 'ngaytao', 'createdat'];

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
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
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