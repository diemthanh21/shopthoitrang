import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, TrendingUp, Users, Package, ShoppingCart } from "lucide-react";
import dashboardService from "../services/dashboardService";

const fmtMoney = (v) =>
  (v ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ revenue: 0, ordersCount: 0, productsCount: 0, customersCount: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

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

  const statCards = [
    { title: "Tổng doanh thu", value: fmtMoney(stats.revenue), change: "+0%", icon: TrendingUp, color: "bg-green-500" },
    { title: "Đơn hàng", value: (stats.ordersCount ?? 0).toLocaleString("vi-VN"), change: "+0%", icon: ShoppingCart, color: "bg-blue-500" },
    { title: "Sản phẩm", value: (stats.productsCount ?? 0).toLocaleString("vi-VN"), change: "+0%", icon: Package, color: "bg-purple-500" },
    { title: "Khách hàng", value: (stats.customersCount ?? 0).toLocaleString("vi-VN"), change: "+0%", icon: Users, color: "bg-orange-500" },
  ];

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
              return (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng gần đây</h2>
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sản phẩm bán chạy</h2>
          <div className="space-y-4">
            {loading && topProducts.length === 0 && <div className="text-gray-500 text-sm">Đang tải...</div>}
            {!loading && topProducts.length === 0 && <div className="text-gray-500 text-sm">Không có dữ liệu</div>}
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
    </div>
  );
}