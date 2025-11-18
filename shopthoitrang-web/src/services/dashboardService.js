import api from "./api";

export async function getDashboardData(opts = {}) {
  // baseURL đã là http://host:port hoặc VITE_API_URL (đã gồm /api?) => tránh lặp "/api"
  // Nếu API_URL = http://localhost:3000 thì route thực tế là /api/dashboard/summary
  // => gọi chỉ "/dashboard/summary" (Express: app.use('/api/dashboard', ...))
  const res = await api.get("/dashboard/summary", { signal: opts.signal });
  const raw  = res?.data ?? {};
  const wrap = raw.summary ?? raw.data ?? raw;

  const num = (v, d = 0) => (v == null || isNaN(+v) ? d : +v);

  const s = wrap.stats ?? wrap;
  const stats = {
    revenue:        num(s.revenue ?? s.total_revenue ?? s.tong_doanh_thu),
    ordersCount:    num(s.ordersCount ?? s.total_orders ?? s.so_don),
    productsCount:  num(s.productsCount ?? s.total_products ?? s.so_san_pham),
    customersCount: num(s.customersCount ?? s.total_customers ?? s.so_khach_hang),
  };

  const pick = (x) =>
    Array.isArray(x) ? x :
    Array.isArray(x?.data) ? x.data :
    Array.isArray(x?.items) ? x.items :
    Array.isArray(x?.result) ? x.result : [];

  const recentOrdersRaw = wrap.recentOrders ?? wrap.orders ?? raw.recentOrders ?? [];
  const topProductsRaw  = wrap.topProducts  ?? wrap.bestSellers ?? raw.topProducts ?? [];

  const recentOrders = pick(recentOrdersRaw).map(r => ({
    id: r.id ?? r.madonhang ?? r.maDonHang,
    customerName: r.customer_name ?? r.tenkhachhang ?? r.makhachhang ?? "Khách hàng",
    totalAmount: +(r.total_amount ?? r.thanhtien ?? r.total ?? 0),
    status: r.status ?? r.trangthaidonhang ?? r.trangthai ?? "",
  }));

  const topProducts = pick(topProductsRaw).map(p => ({
    id: p.id ?? p.masanpham ?? p.maSanPham,
    name: p.name ?? p.tensanpham ?? p.tenSanPham ?? "Sản phẩm",
    price: +(p.price ?? p.gia ?? p.giaban ?? 0),
    soldCount: +(p.sold_count ?? p.soluongban ?? 0),
  }));

  return { stats, recentOrders, topProducts };
}
export default { getDashboardData };
