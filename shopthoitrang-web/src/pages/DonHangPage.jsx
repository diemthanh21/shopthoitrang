import { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingCart, Search, Eye, Edit, Trash2 } from "lucide-react";
import donhangService from "../services/donhangService";

// format helpers
const fmtCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(v || 0));
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");

function StatusDot({ color }) {
  return <span className={`inline-block w-2 h-2 rounded-full mr-2 ${color}`} />;
}
function Badge({ children, color }) {
  return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{children}</span>;
}

export default function DonHangPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // hủy request cũ khi re-load
  const abortRef = useRef(null);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        // nếu muốn filter từ server: { status: statusFilter, q }
        const data = await donhangService.getAll({}, { signal: controller.signal });
        setRows(Array.isArray(data) ? data : []);
        setErr("");
      } catch (e) {
        if (e.name === "AbortError" || e.name === "CanceledError") return;
        console.error(e);
        setRows([]);
        setErr("Không thể tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []); // load 1 lần

  // filter client
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okSt = statusFilter ? r.trangThaiDonHang === statusFilter : true;
      if (!okSt) return false;
      if (!term) return true;
      const hay = [
        r.maDonHang, r.maKhachHang, r.phuongThucThanhToan,
        r.trangThaiThanhToan, r.trangThaiDonHang
      ].map((x) => String(x ?? "")).join(" ").toLowerCase();
      return hay.includes(term);
    });
  }, [rows, q, statusFilter]);

  // thống kê theo trangThaiDonHang
  const stats = useMemo(() => {
    const s = { choxacnhan: 0, danggiao: 0, hoanthanh: 0, dahuy: 0 };
    for (const r of rows) {
      const v = (r.trangThaiDonHang || "").toLowerCase();
      if (v.includes("chờ")) s.choxacnhan++;
      else if (v.includes("giao")) s.danggiao++;
      else if (v.includes("hoàn") || v.includes("xong")) s.hoanthanh++;
      else if (v.includes("hủy")) s.dahuy++;
    }
    return s;
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShoppingCart className="text-blue-600" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-gray-600">Quản lý các đơn hàng của khách hàng</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-yellow-500" /> Chờ xác nhận
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.choxacnhan}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-blue-500" /> Đang giao
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.danggiao}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-green-500" /> Hoàn thành
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.hoanthanh}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-red-500" /> Đã hủy
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.dahuy}</div>
        </div>
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 border">
        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {err}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm đơn hàng..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Tất cả trạng thái</option>
            <option>Chờ xác nhận</option>
            <option>Đang giao</option>
            <option>Hoàn thành</option>
            <option>Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Chưa có đơn hàng nào</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã đơn</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã KH</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ngày đặt</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Thành tiền</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PT thanh toán</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TT thanh toán</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trạng thái đơn</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((r) => (
                <tr key={r.maDonHang} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.maDonHang}</td>
                  <td className="px-4 py-3 text-sm">{r.maKhachHang ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">{fmtDate(r.ngayDatHang)}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{fmtCurrency(r.thanhTien)}</td>
                  <td className="px-4 py-3 text-sm">{r.phuongThucThanhToan ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      color={
                        (r.trangThaiThanhToan || "").toLowerCase().includes("đã")
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {r.trangThaiThanhToan || "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      color={
                        (r.trangThaiDonHang || "").toLowerCase().includes("hủy")
                          ? "bg-red-100 text-red-700"
                          : (r.trangThaiDonHang || "").toLowerCase().includes("hoàn")
                          ? "bg-green-100 text-green-700"
                          : (r.trangThaiDonHang || "").toLowerCase().includes("giao")
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {r.trangThaiDonHang || "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-blue-600 hover:text-blue-800 mr-3"><Eye size={18} /></button>
                    <button className="text-blue-600 hover:text-blue-800 mr-3"><Edit size={18} /></button>
                    <button className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
