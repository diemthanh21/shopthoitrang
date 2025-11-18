import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Users, Package, ShoppingCart } from "lucide-react";
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

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardData({ signal: controller.signal });
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
    })();

    return () => controller.abort();
  }, []);

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
    { title: "Tổng doanh thu", value: fmtMoney(stats.revenue), change: "+0%", icon: TrendingUp, color: "bg-green-500", clickable: true },
    { title: "Đơn hàng", value: (stats.ordersCount ?? 0).toLocaleString("vi-VN"), change: "+0%", icon: ShoppingCart, color: "bg-blue-500", clickable: true },
    { title: "Sản phẩm", value: (stats.productsCount ?? 0).toLocaleString("vi-VN"), change: "+0%", icon: Package, color: "bg-purple-500", clickable: true },
    { title: "Khách hàng", value: (stats.customersCount ?? 0).toLocaleString("vi-VN"), change: "+0%", icon: Users, color: "bg-orange-500", clickable: true },
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
      const data = await dashboardService.getRevenueFlow(range);
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
      <div className="flex items-center gap-3">
        <LayoutDashboard className="text-blue-600" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
          <p className="text-gray-600">Xem tổng quan về hoạt động của shop</p>
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
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${s.color} p-3 rounded-lg`}>
                      <Icon className="text-white" size={24} />
                    </div>
                    <span className="text-green-600 text-sm font-medium">{s.change}</span>
                  </div>
                  <h3 className="text-gray-600 text-sm mb-1">{s.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              );
            })}
      </div>

      {/* Two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h2>
            <button
              onClick={openOrdersQuick}
              className="text-sm px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50"
            >
              Xem nhanh
            </button>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Sản phẩm bán chạy</h2>
            <div className="flex items-center gap-2">
              <input type="date" value={topRange.from} onChange={(e) => setTopRange(r => ({ ...r, from: e.target.value }))} className="border rounded px-2 py-1 text-sm" />
              <input type="date" value={topRange.to} onChange={(e) => setTopRange(r => ({ ...r, to: e.target.value }))} className="border rounded px-2 py-1 text-sm" />
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm" onClick={loadTopByRange}>Lọc</button>
            </div>
          </div>
          <div className="space-y-4">
            {(loading || topLoading) && topProducts.length === 0 && <div className="text-gray-500 text-sm">Đang tải...</div>}
            {!loading && !topLoading && topError && <div className="text-red-600 text-sm">{topError}</div>}
            {!loading && !topLoading && !topError && topProducts.length === 0 && <div className="text-gray-500 text-sm">Không có dữ liệu</div>}
            {topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-600">Đã bán: {p.soldCount ?? 0}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{fmtMoney(p.price)}</p>
                </div>
              </div>
            ))}
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
            {/* Range filter (static for skeleton) */}
            <div className="flex gap-3 mb-4">
              <input type="date" value={range.from} onChange={(e) => setRange(r => ({ ...r, from: e.target.value }))} className="border rounded px-3 py-2" />
              <input type="date" value={range.to} onChange={(e) => setRange(r => ({ ...r, to: e.target.value }))} className="border rounded px-3 py-2" />
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={openFlow}>Tải lại</button>
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
