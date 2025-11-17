import { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingCart, Search, Eye, Check, Package, Truck, XCircle } from "lucide-react";
import donhangService from "../services/donhangService";
import trahangService from "../services/trahangService";

// format helpers
const fmtCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(v || 0));
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "");

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
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [returnsOpen, setReturnsOpen] = useState(false);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnsRows, setReturnsRows] = useState([]);
  const [returnsErr, setReturnsErr] = useState("");

  // hủy request cũ khi re-load
  const abortRef = useRef(null);

  const loadData = async (signal) => {
    try {
      setLoading(true);
      setErr("");
      setMsg("");
      const data = await donhangService.getAll({}, { signal });

      // Lọc bỏ các đơn hàng có trạng thái 'cart' (giỏ hàng chưa checkout)
      const validOrders = Array.isArray(data)
        ? data.filter((order) => {
            const status = (order.trangThaiDonHang || order.trangthaidonhang || "").toLowerCase();
            return status !== "cart" && status !== "gio hang" && status !== "giỏ hàng";
          })
        : [];

      setRows(validOrders);
    } catch (e) {
      if (e.name === "AbortError" || e.name === "CanceledError") return;
      console.error(e);
      setRows([]);
      setErr("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    loadData(controller.signal);
    return () => controller.abort();
  }, []); // load 1 lần

  const normStatus = (v) => {
    const s = (v || "").trim().toLowerCase();
    if (s === "chờ xác nhận") return "Chờ xác nhận";
    if (s === "chờ lấy hàng") return "Chờ lấy hàng";
    if (s === "đang giao") return "Đang giao";
    if (s === "đã giao" || s === "hoàn thành") return "Đã giao";
    if (s.includes("hủy")) return "Đã hủy";
    return v || "";
  };

  // filter client
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okSt = statusFilter ? normStatus(r.trangThaiDonHang) === statusFilter : true;
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
    const s = { choxacnhan: 0, cholayhang: 0, danggiao: 0, dagiao: 0, dahuy: 0 };
    for (const r of rows) {
      const v = normStatus(r.trangThaiDonHang);
      if (v === "Chờ xác nhận") s.choxacnhan++;
      else if (v === "Chờ lấy hàng") s.cholayhang++;
      else if (v === "Đang giao") s.danggiao++;
      else if (v === "Đã giao") s.dagiao++;
      else if (v === "Đã hủy") s.dahuy++;
    }
    return s;
  }, [rows]);

  const setStatus = async (order, newStatus, paymentStatus) => {
    try {
      setUpdatingId(order.maDonHang);
      setErr("");
      setMsg("");
      // optimistic update
      setRows((prev) => prev.map((r) => (r.maDonHang === order.maDonHang ? { ...r, trangThaiDonHang: newStatus, ...(paymentStatus ? { trangThaiThanhToan: paymentStatus } : {}) } : r)));
      const updated = await donhangService.update(order.maDonHang, {
        trangThaiDonHang: newStatus,
        ...(paymentStatus ? { trangThaiThanhToan: paymentStatus } : {}),
      });
      // ensure normalized
      setRows((prev) => prev.map((r) => (r.maDonHang === order.maDonHang ? { ...r, ...updated } : r)));
      setMsg(`Đã cập nhật đơn ${order.maDonHang} → ${newStatus}`);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Cập nhật trạng thái thất bại");
      // reload to rollback optimistic change
      await loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  const renderActions = (r) => {
    const st = normStatus(r.trangThaiDonHang);
    const disabled = updatingId === r.maDonHang;
    const btn = (onClick, label, cls, Icon) => (
      <button
        disabled={disabled}
        onClick={onClick}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border ${cls} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {Icon ? <Icon size={14} /> : null}
        {label}
      </button>
    );

    if (st === "Chờ xác nhận") {
      return (
        <div className="flex justify-end gap-2">
          {btn(() => setStatus(r, "Chờ lấy hàng"), "Duyệt", "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100", Check)}
          {btn(() => {
            if (window.confirm(`Hủy đơn ${r.maDonHang}?`)) setStatus(r, "Đã hủy");
          }, "Hủy", "bg-red-50 text-red-700 border-red-200 hover:bg-red-100", XCircle)}
        </div>
      );
    }
    if (st === "Chờ lấy hàng") {
      return (
        <div className="flex justify-end gap-2">
          {btn(() => setStatus(r, "Đang giao"), "Giao hàng", "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100", Package)}
          {btn(() => {
            if (window.confirm(`Hủy đơn ${r.maDonHang}?`)) setStatus(r, "Đã hủy");
          }, "Hủy", "bg-red-50 text-red-700 border-red-200 hover:bg-red-100", XCircle)}
        </div>
      );
    }
    if (st === "Đang giao") {
      return (
        <div className="flex justify-end gap-2">
          {btn(() => setStatus(r, "Đã giao"), "Đã giao", "bg-green-50 text-green-700 border-green-200 hover:bg-green-100", Truck)}
        </div>
      );
    }
    return <div className="text-right text-gray-400 text-xs"></div>;
  };
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

      {/* Stats quick cards (clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { key: "Chờ xác nhận", label: "Chờ xác nhận", color: "bg-yellow-500", value: stats.choxacnhan },
          { key: "Chờ lấy hàng", label: "Chờ lấy hàng", color: "bg-indigo-500", value: stats.cholayhang },
          { key: "Đang giao", label: "Đang giao", color: "bg-blue-500", value: stats.danggiao },
          { key: "Đã giao", label: "Đã giao", color: "bg-green-500", value: stats.dagiao },
          { key: "Đã hủy", label: "Đã hủy", color: "bg-red-500", value: stats.dahuy },
        ].map((c) => {
          const active = statusFilter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setStatusFilter(active ? "" : c.key)}
              className={`text-left bg-white border rounded-xl p-3 transition-colors cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${active ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"}`}
            >
              <div className="text-xs font-medium text-gray-600 flex items-center">
                <StatusDot color={c.color} /> {c.label}
              </div>
              <div className="mt-1.5 text-2xl font-bold">{c.value}</div>
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 border">
        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{err}</div>
        )}
        {msg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{msg}</div>
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
            <option>Chờ lấy hàng</option>
            <option>Đang giao</option>
            <option>Đã giao</option>
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
                  <td className="px-4 py-3 text-sm">{r.maKhachHang ?? ""}</td>
                  <td className="px-4 py-3 text-sm">{fmtDate(r.ngayDatHang)}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{fmtCurrency(r.thanhTien)}</td>
                  <td className="px-4 py-3 text-sm">{r.phuongThucThanhToan ?? ""}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      color={
                        (r.trangThaiThanhToan || "").toLowerCase().includes("đã")
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {r.trangThaiThanhToan || ""}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      color={
                        (normStatus(r.trangThaiDonHang) || "").toLowerCase().includes("hủy")
                          ? "bg-red-100 text-red-700"
                          : normStatus(r.trangThaiDonHang) === "Đã giao"
                          ? "bg-green-100 text-green-700"
                          : normStatus(r.trangThaiDonHang) === "Đang giao"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {normStatus(r.trangThaiDonHang)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {renderActions(r)}
                      <button title="Xem chi tiết" onClick={() => setDetailId(r.maDonHang)} className="text-blue-600 hover:text-blue-800"><Eye size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order detail drawer */}
      {detailId != null && (
        <OrderDetailDrawer orderId={detailId} onClose={() => setDetailId(null)} />
      )}

      {/* Returns drawer */}
      {returnsOpen && (
        <ReturnsDrawer
          rows={returnsRows}
          loading={returnsLoading}
          err={returnsErr}
          onClose={() => setReturnsOpen(false)}
        />
      )}
    </div>
  );
}

function OrderDetailDrawer({ orderId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await donhangService.getById(orderId);
        if (mounted) setOrder(data);
      } catch (e) {
        console.error(e);
        if (mounted) setErr("Không thể tải chi tiết đơn hàng");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  const maskClose = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const total = useMemo(() => {
    if (!order?.items) return order?.thanhTien ?? 0;
    return order.items.reduce((s, it) => s + Number(it.thanhTien ?? (it.soLuong || 0) * (it.donGia || 0)), 0);
  }, [order]);

  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/30" onClick={maskClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl border-l flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Chi tiết đơn hàng</div>
            <div className="text-xl font-semibold">Mã đơn #{orderId}</div>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 rounded-md border hover:bg-gray-50">Đóng</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-gray-500">Đang tải...</div>
          ) : err ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{err}</div>
          ) : order ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                <Field label="Mã đơn" value={order.maDonHang} />
                <Field label="Ngày đặt" value={fmtDate(order.ngayDatHang)} />
                <Field label="PT thanh toán" value={order.phuongThucThanhToan ?? ""} />
                <Field label="TT thanh toán" value={order.trangThaiThanhToan ?? ""} />
                <Field label="Trạng thái đơn" value={order.trangThaiDonHang ?? ""} />
                <Field label="Tổng tiền" value={fmtCurrency(total)} />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-white border rounded-lg p-3">
                  <div className="font-semibold mb-2">Khách hàng</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Field label="Mã KH" value={order.maKhachHang ?? order?.khachHang?.makhachhang ?? ""} />
                    <Field label="Họ tên" value={order?.khachHang?.hoten ?? ""} />
                    <Field label="Email" value={order?.khachHang?.email ?? ""} />
                    <Field label="SĐT" value={order?.khachHang?.sodienthoai ?? order?.diaChi?.sodienthoai ?? ""} />
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-3">
                  <div className="font-semibold mb-2">Địa chỉ giao hàng</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Field label="Người nhận" value={order?.diaChi?.ten ?? order?.khachHang?.hoten ?? ""} />
                    <Field label="SĐT" value={order?.diaChi?.sodienthoai ?? ""} />
                    <Field label="Phường/Xã" value={order?.diaChi?.phuong ?? ""} />
                    <Field label="Tỉnh/TP" value={order?.diaChi?.tinh ?? ""} />
                    <Field label="Địa chỉ cụ thể" value={order?.diaChi?.diachicuthe ?? ""} />
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2">Sản phẩm</div>
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Sản phẩm</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Phân loại</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Đơn giá</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Số lượng</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {order.items.map((it) => (
                          <tr key={it.maChiTietDonHang}>
                            <td className="px-3 py-2 text-sm">
                              <div className="flex items-center gap-3">
                                <img src={it.imageUrl} alt="sp" className="w-12 h-12 object-cover rounded border" onError={(e)=>{e.currentTarget.style.visibility='hidden';}} />
                                <div>
                                  <div className="font-medium">{it.productName ?? `CTSP #${it.maChiTietSanPham}`}</div>
                                  <div className="text-xs text-gray-500">Mã CTSP: {it.maChiTietSanPham}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm">Màu: {it?.variant?.color ?? ""} • Size: {it?.variant?.size ?? ""}</td>
                            <td className="px-3 py-2 text-sm text-right">{fmtCurrency(it.donGia)}</td>
                            <td className="px-3 py-2 text-sm text-center">{it.soLuong}</td>
                            <td className="px-3 py-2 text-sm text-right">{fmtCurrency(it.thanhTien ?? Number(it.soLuong) * Number(it.donGia))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="px-3 py-2 text-sm font-medium" colSpan={3}>Tổng</td>
                          <td className="px-3 py-2 text-sm text-right font-semibold">{fmtCurrency(total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500">Đơn hàng chưa có chi tiết.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function ReturnsDrawer({ rows, loading, err, onClose }) {
  return (
    <div className="fixed inset-0 z-[1100]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl border-l flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Yêu cầu trả hàng</div>
            <div className="text-xl font-semibold">Danh sách yêu cầu</div>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 rounded-md border hover:bg-gray-50">Đóng</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-gray-500">Đang tải...</div>
          ) : err ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{err}</div>
          ) : rows && rows.length > 0 ? (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.maTraHang || r.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between">
                    <div className="font-medium">Yêu cầu #{r.maTraHang ?? r.id}</div>
                    <div className="text-sm text-gray-500">{r.trangThai ?? r.trangthai ?? ''}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Đơn: {r.maDonHang ?? ''} • KH: {r.maKhachHang ?? ''}</div>
                  <div className="text-sm text-gray-600 mt-1">Sản phẩm: {r.maChiTietSanPham ?? ''} • Số lượng: {r.soLuong}</div>
                  <div className="text-sm text-gray-600 mt-1">Lý do: {r.lyDo ?? r.lydo ?? ''}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">Chưa có yêu cầu trả hàng</div>
          )}
        </div>
      </div>
    </div>
  );
}
