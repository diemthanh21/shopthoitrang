import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Users, Package, ShoppingCart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dashboardService from "../services/dashboardService";
import donhangService from "../services/donhangService";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

const fmtMoney = (v) =>
  (v ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ revenue: 0, ordersCount: 0, productsCount: 0, customersCount: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topLoading, setTopLoading] = useState(false);
  const [topError, setTopError] = useState("");
  const [ordersDrawerOpen, setOrdersDrawerOpen] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingErr, setPendingErr] = useState("");
  const [pendingRows, setPendingRows] = useState([]);
  const [pendingUpdatingId, setPendingUpdatingId] = useState(null);
  const [hasNewOrder, setHasNewOrder] = useState(false);

  // Chart data
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartFilterType, setChartFilterType] = useState('month'); // 'month' or 'year'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Date range filter for stats
  const [statsRange, setStatsRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const fmt = (d) => d.toISOString().slice(0, 10);
    return { from: fmt(start), to: fmt(now) };
  });

  // Revenue flow modal state
  const [flowOpen, setFlowOpen] = useState(false);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowError, setFlowError] = useState("");
  const [flowData, setFlowData] = useState(null);
  const [range, setRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const fmt = (d) => d.toISOString().slice(0, 10);
    return { from: fmt(start), to: fmt(now) };
  });
  const [topRange, setTopRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const fmt = (d) => d.toISOString().slice(0, 10);
    return { from: fmt(start), to: fmt(now) };
  });

  const abortRef = useRef(null);

  const loadDashboardData = async (dateRange = {}) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const params = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;
      const data = await dashboardService.getDashboardData({ signal: controller.signal, params });
      setStats(data.stats || {});
      setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);
      setTopProducts(Array.isArray(data.topProducts) ? data.topProducts : []);
      setError("");
    } catch (e) {
      if (e.name !== "AbortError" && e.name !== "CanceledError") {
        console.error(e);
        setError("Không thể tải dữ liệu dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async (dateRange = {}) => {
    try {
      setChartLoading(true);
      const data = await dashboardService.getChartData({ from: dateRange.from, to: dateRange.to });
      setChartData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setChartLoading(false);
    }
  };

  const loadChartByMonth = async (monthStr) => {
    const [year, month] = monthStr.split('-').map(Number);
    // Use local date formatting to avoid timezone issues
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    // Get last day of month
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    await loadChartData({ from, to });
  };

  const loadChartByYear = async (year) => {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const data = await dashboardService.getChartData({ from: fmt(from), to: fmt(to) });
    
    // Group by month - only include data from the selected year
    const monthMap = new Map();
    data.forEach(item => {
      const date = new Date(item.date + 'T00:00:00'); // Parse as local date
      const itemYear = date.getFullYear();
      
      // Only include data from the selected year
      if (itemYear !== year) return;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { date: monthKey, orders: 0, revenue: 0 });
      }
      const monthData = monthMap.get(monthKey);
      monthData.orders += item.orders;
      monthData.revenue += item.revenue;
    });
    
    setChartData(Array.from(monthMap.values()));
  };

  useEffect(() => {
    loadDashboardData(statsRange);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    // Load chart data based on filter type
    if (chartFilterType === 'month') {
      loadChartByMonth(selectedMonth);
    } else {
      loadChartByYear(selectedYear);
    }
  }, []);

  const handleStatsRangeChange = () => {
    loadDashboardData(statsRange);
  };

  const loadTopByRange = async () => {
    try {
      setTopLoading(true);
      setTopError("");
      const items = await dashboardService.getTopProducts({ from: topRange.from, to: topRange.to, limit: 5 });
      setTopProducts(items);
    } catch (e) {
      console.error(e);
      setTopError("Không thể tải sản phẩm bán chạy theo tháng");
    } finally {
      setTopLoading(false);
    }
  };

  useEffect(() => {
    // Load top products for current month on mount
    loadTopByRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statCards = [
    { title: "Tổng doanh thu", value: fmtMoney(stats.revenue), icon: TrendingUp, color: "bg-green-500", clickable: true },
    { title: "Đơn hàng", value: (stats.ordersCount ?? 0).toLocaleString("vi-VN"), icon: ShoppingCart, color: "bg-blue-500", clickable: true },
    { title: "Sản phẩm", value: (stats.productsCount ?? 0).toLocaleString("vi-VN"), icon: Package, color: "bg-purple-500", clickable: true },
    { title: "Khách hàng", value: (stats.customersCount ?? 0).toLocaleString("vi-VN"), icon: Users, color: "bg-orange-500", clickable: true },
  ];

  const canViewFlow = ["ADMIN", "MANAGER"].includes((user?.maQuyen || "").toUpperCase());

  const openFlow = async () => {
    if (!canViewFlow) {
      setError("Bạn không có quyền xem dòng tiền");
      return;
    }
    setFlowOpen(true);
    setFlowLoading(true);
    setFlowError("");
    try {
      // Sử dụng statsRange thay vì range riêng
      const data = await dashboardService.getRevenueFlow(statsRange);
      setFlowData(data);
    } catch (e) {
      console.error(e);
      setFlowError("Không thể tải dòng tiền");
    } finally {
      setFlowLoading(false);
    }
  };

  const openOrdersQuick = async () => {
    setOrdersDrawerOpen(true);
    setPendingLoading(true);
    setPendingErr("");
    try {
      const rows = await donhangService.getAll({ status: 'Chờ xác nhận' });
      setPendingRows(rows);
    } catch (e) {
      console.error(e);
      setPendingErr(e?.response?.data?.message || 'Không thể tải đơn chờ xác nhận');
      setPendingRows([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setPendingUpdatingId(orderId);
      await donhangService.update(orderId, { trangThaiDonHang: newStatus });
      setPendingRows((prev) => prev.filter((r) => r.maDonHang !== orderId));
    } catch (e) {
      console.error(e);
      setPendingErr(e?.response?.data?.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setPendingUpdatingId(null);
    }
  };

  // Realtime: lắng nghe đơn hàng mới tạo
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('public:donhang')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donhang' }, (payload) => {
        try {
          const row = payload.new || {};
          setHasNewOrder(true);
          setStats((s) => ({ ...s, ordersCount: (s.ordersCount ?? 0) + 1 }));
          const mapped = {
            id: row.id || row.madonhang || row.maDonHang,
            customerName: row.customer_name || row.tenkhachhang || row.makhachhang || 'Khách hàng',
            totalAmount: +(row.total_amount ?? row.thanhtien ?? 0),
            status: row.status ?? row.trangthaidonhang ?? row.trangthai ?? '',
          };
          setRecentOrders((prev) => [mapped, ...prev.filter((_, i) => i < 9)]);
          const st = (row.status ?? row.trangthaidonhang ?? row.trangThaiDonHang ?? '').toLowerCase();
          if (ordersDrawerOpen && st.includes('chờ') && st.includes('xác')) {
            setPendingRows((prev) => [
              {
                maDonHang: row.madonhang || row.maDonHang || row.id,
                maKhachHang: row.makhachhang || row.maKhachHang,
                thanhTien: +(row.total_amount ?? row.thanhtien ?? 0),
                trangThaiDonHang: row.status ?? row.trangthaidonhang ?? row.trangThaiDonHang,
              },
              ...prev,
            ]);
          }
        } catch (err) {
          console.error('Realtime đơn hàng lỗi', err);
        }
      })
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch (e) { /* ignore */ }
    };
  }, [ordersDrawerOpen]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
            <p className="text-gray-600">Xem tổng quan về hoạt động của shop</p>
          </div>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm px-4 py-3 border border-gray-200">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Từ:</label>
            <input
              type="date"
              value={statsRange.from}
              max={statsRange.to}
              onChange={(e) => setStatsRange(r => ({ ...r, from: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Đến:</label>
            <input
              type="date"
              value={statsRange.to}
              min={statsRange.from}
              onChange={(e) => setStatsRange(r => ({ ...r, to: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleStatsRangeChange}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            {loading ? 'Đang tải...' : 'Áp dụng'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse h-32" />
            ))
          : statCards.map((s, i) => {
              const Icon = s.icon;
              const isOrdersCard = s.title === "Đơn hàng";
              return (
                <div
                  key={i}
                  className={`relative bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow ${s.clickable ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (i === 0 && s.clickable && canViewFlow) {
                      openFlow();
                    } else if (isOrdersCard) {
                      navigate('/donhang?status='+encodeURIComponent('Chờ xác nhận')+'&range=7d');
                    } else if (s.title === "Sản phẩm") {
                      navigate('/sanpham');
                    } else if (s.title === "Khách hàng") {
                      navigate('/khachhang');
                    }
                  }}
                >
                  {hasNewOrder && isOrdersCard && (
                    <>
                      <span className="absolute top-2 right-2 inline-flex w-3 h-3 bg-red-500 rounded-full animate-ping" />
                      <span className="absolute top-2 right-2 inline-flex w-3 h-3 bg-red-500 rounded-full" />
                    </>
                  )}
                  <div className="flex items-center justify-start mb-4">
                    <div className={`${s.color} p-3 rounded-lg`}>
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm mb-1">{s.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              );
            })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Biểu đồ đơn hàng</h2>
            <div className="flex items-center gap-2">
              <select 
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={chartFilterType}
                onChange={(e) => {
                  setChartFilterType(e.target.value);
                  if (e.target.value === 'month') {
                    loadChartByMonth(selectedMonth);
                  } else {
                    loadChartByYear(selectedYear);
                  }
                }}
              >
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
              
              {chartFilterType === 'month' ? (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    loadChartByMonth(e.target.value);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    loadChartByYear(Number(e.target.value));
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          {chartLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">Đang tải...</div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">Không có dữ liệu</div>
          ) : (
            <div className={chartFilterType === 'month' ? "w-full overflow-x-auto" : "w-full"}>
              <div style={{ minWidth: chartFilterType === 'month' ? '1200px' : '100%' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (chartFilterType === 'year') {
                          const [year, month] = value.split('-');
                          return `Tháng ${parseInt(month)}`;
                        }
                        const d = new Date(value);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => {
                        if (chartFilterType === 'year') {
                          const [year, month] = value.split('-');
                          return `Tháng ${parseInt(month)}/${year}`;
                        }
                        const d = new Date(value);
                        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                      }}
                      formatter={(value) => [value, "Đơn hàng"]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Đơn hàng"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Biểu đồ doanh thu</h2>
            <div className="flex items-center gap-2">
              <select 
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={chartFilterType}
                onChange={(e) => {
                  setChartFilterType(e.target.value);
                  if (e.target.value === 'month') {
                    loadChartByMonth(selectedMonth);
                  } else {
                    loadChartByYear(selectedYear);
                  }
                }}
              >
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
              
              {chartFilterType === 'month' ? (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    loadChartByMonth(e.target.value);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    loadChartByYear(Number(e.target.value));
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          {chartLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">Đang tải...</div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">Không có dữ liệu</div>
          ) : (
            <div className={chartFilterType === 'month' ? "w-full overflow-x-auto" : "w-full"}>
              <div style={{ minWidth: chartFilterType === 'month' ? '1200px' : '100%' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (chartFilterType === 'year') {
                          const [year, month] = value.split('-');
                          return `Tháng ${parseInt(month)}`;
                        }
                        const d = new Date(value);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      labelFormatter={(value) => {
                        if (chartFilterType === 'year') {
                          const [year, month] = value.split('-');
                          return `Tháng ${parseInt(month)}/${year}`;
                        }
                        const d = new Date(value);
                        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                      }}
                      formatter={(value) => [fmtMoney(value), "Doanh thu"]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Doanh thu"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h2>
          </div>
          <div className="space-y-4">
            {loading && recentOrders.length === 0 && <div className="text-gray-500 text-sm">Đang tải...</div>}
            {!loading && recentOrders.length === 0 && <div className="text-gray-500 text-sm">Không có đơn hàng</div>}
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">ĐH-{o.id}</p>
                  <p className="text-sm text-gray-600">{o.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{fmtMoney(o.totalAmount)}</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded capitalize">
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">🏆 Sản phẩm bán chạy</h2>
            <div className="flex items-center gap-2">
              <input type="date" value={topRange.from} max={topRange.to} onChange={(e) => setTopRange(r => ({ ...r, from: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="date" value={topRange.to} min={topRange.from} onChange={(e) => setTopRange(r => ({ ...r, to: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm" onClick={loadTopByRange}>Lọc</button>
            </div>
          </div>
          <div className="space-y-3">
            {(loading || topLoading) && topProducts.length === 0 && <div className="text-gray-500 text-sm text-center py-8">Đang tải...</div>}
            {!loading && !topLoading && topError && <div className="text-red-600 text-sm text-center py-8 bg-red-50 rounded-lg p-4">{topError}</div>}
            {!loading && !topLoading && !topError && topProducts.length === 0 && <div className="text-gray-500 text-sm text-center py-8">Không có dữ liệu</div>}
            {topProducts.map((p, index) => {
              const rankColors = [
                'from-yellow-400 to-yellow-600', // Top 1 - Gold
                'from-gray-400 to-gray-600',     // Top 2 - Silver
                'from-orange-400 to-orange-600', // Top 3 - Bronze
                'from-blue-400 to-blue-600',     // Top 4+
              ];
              const colorClass = rankColors[Math.min(index, 3)];
              
              return (
                <div 
                  key={p.id} 
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-blue-50 hover:to-white transition-all duration-200 cursor-pointer border border-gray-100 hover:border-blue-200 hover:shadow-md"
                  onClick={() => navigate(`/sanpham/${p.id}`)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-14 h-14 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:scale-110 transition-transform duration-200`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{p.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Đã bán: <span className="font-medium text-gray-900">{p.soldCount ?? 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg text-blue-600">{fmtMoney(p.price)}</p>
                    <span className="text-xs text-gray-500">Giá bán</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revenue Flow Modal */}
      {flowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFlowOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Dòng tiền (Thu/Chi)</h3>
              <button onClick={() => setFlowOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            {flowLoading && <div className="text-gray-600">Đang tải...</div>}
            {!flowLoading && flowError && <div className="text-red-600">{flowError}</div>}
            {!flowLoading && !flowError && flowData && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded">
                    <div className="text-sm text-gray-600">Tổng thu</div>
                    <div className="text-2xl font-bold">{fmtMoney(flowData.inflow?.total || 0)}</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded">
                    <div className="text-sm text-gray-600">Tổng chi</div>
                    <div className="text-2xl font-bold">{fmtMoney(flowData.outflow?.total || 0)}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded">
                    <div className="text-sm text-gray-600">Chênh lệch</div>
                    <div className="text-2xl font-bold">{fmtMoney(flowData.net || 0)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold mb-2">Nguồn thu</div>
                    <div className="space-y-2">
                      {(flowData.inflow?.sources || []).map((s) => (
                        <div key={s.key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span>{s.label}</span>
                          <span className="font-medium">{fmtMoney(s.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Nguồn chi</div>
                    <div className="space-y-2">
                      {(flowData.outflow?.sources || []).map((s) => (
                        <div key={s.key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span>{s.label}</span>
                          <span className="font-medium">{fmtMoney(s.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Orders Quick Drawer */}
      {ordersDrawerOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOrdersDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl border-l flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Đơn hàng</div>
                <div className="text-xl font-semibold">Chờ xác nhận</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setOrdersDrawerOpen(false)} className="px-3 py-1.5 rounded-md border hover:bg-gray-50 text-sm">Đóng</button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {pendingLoading && <div className="text-gray-500 text-sm">Đang tải...</div>}
              {!pendingLoading && pendingErr && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">{pendingErr}</div>}
              {!pendingLoading && !pendingErr && pendingRows.length === 0 && <div className="text-gray-500 text-sm">Không có đơn chờ xác nhận</div>}
              {pendingRows.map((o) => (
                <div key={o.maDonHang} className="p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition">
                  <div className="flex items-center justify-between">
                    <div className="cursor-pointer" onClick={() => { navigate('/donhang/'+o.maDonHang); setOrdersDrawerOpen(false); }}>
                      <div className="font-medium text-gray-900">ĐH-{o.maDonHang}</div>
                      <div className="text-xs text-gray-600">KH: {o.maKhachHang ?? '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{fmtMoney(o.thanhTien)}</div>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Chờ xác nhận</span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      disabled={pendingUpdatingId === o.maDonHang}
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(o.maDonHang, 'Chờ lấy hàng'); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                    >
                      Duyệt
                    </button>
                    <button
                      disabled={pendingUpdatingId === o.maDonHang}
                      onClick={(e) => { e.stopPropagation(); if (window.confirm(`Hủy đơn ${o.maDonHang}?`)) updateOrderStatus(o.maDonHang, 'Đã hủy'); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 disabled:opacity-50"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}