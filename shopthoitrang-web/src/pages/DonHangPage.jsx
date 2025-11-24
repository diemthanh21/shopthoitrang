import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ShoppingCart,
  Search,
  Eye,
  Check,
  Package,
  XCircle,
} from "lucide-react";

import donhangService from "../services/donhangService";
import trahangService from "../services/trahangService"; // nếu chưa dùng có thể xóa
import nhanvienService from "../services/nhanvienService";
import lichsudonhangService from "../services/lichsudonhangService";
import { useAuth } from "../contexts/AuthContext";

// format helpers
const fmtCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN") : "";

function StatusDot({ color }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${color}`} />
  );
}
function Badge({ children, color }) {
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
      {children}
    </span>
  );
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

  // returns drawer (nếu bạn chưa dùng có thể bỏ)
  const [returnsOpen, setReturnsOpen] = useState(false);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnsRows, setReturnsRows] = useState([]);
  const [returnsErr, setReturnsErr] = useState("");

  // map nhân viên để hiển thị "mã - tên"
  const [employeeMap, setEmployeeMap] = useState({}); // { id: {id, hoten} }
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [forceReloadKey, setForceReloadKey] = useState(0); // Key để force reload

  // modal hủy + reason
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const { user } = useAuth?.() || {};
  
  // Force reload khi user thay đổi (đăng nhập/đăng xuất)
  useEffect(() => {
    setForceReloadKey(prev => prev + 1);
  }, [user?.token, user?.accessToken, user?.manhanvien, user?.maNhanVien]);

  // hủy request cũ khi re-load
  const abortRef = useRef(null);

  const getCurrentEmployeeId = () => {
    const idFromCtx =
      user?.manhanvien ??
      user?.maNhanVien ??
      user?.id ??
      user?.user_id;
    if (idFromCtx != null) return Number(idFromCtx);

    try {
      const raw =
        localStorage.getItem("user") ||
        localStorage.getItem("authUser") ||
        localStorage.getItem("currentUser");
      if (!raw) return null;
      const u = JSON.parse(raw);
      return Number(
        u?.manhanvien ??
          u?.maNhanVien ??
          u?.id ??
          u?.user_id ??
          null
      );
    } catch {
      return null;
    }
  };

  const loadEmployees = async (signal) => {
    try {
      console.log('[DonHangPage] Loading employees...', { forceReloadKey });
      setEmployeeLoading(true);
      setEmployeeMap({}); // Reset map trước khi load
      
      const data = await nhanvienService.getAll({}, { signal });
      const list = Array.isArray(data) ? data : data?.data || [];
      console.log('[DonHangPage] Loaded employees:', list.length, 'items');

      const map = {};
      for (const nv of list) {
        const id = nv.manhanvien ?? nv.maNhanVien ?? nv.id;
        if (!id) continue;
        map[id] = {
          id: Number(id),
          hoten: nv.hoten ?? nv.hoTen ?? nv.tenNhanVien ?? "",
          machucnang: nv.machucnang ?? nv.maChucNang ?? nv.role ?? "",
        };
      }
      console.log('[DonHangPage] Employee map created:', Object.keys(map).length, 'entries');
      setEmployeeMap(map);
    } catch (e) {
      if (e.name === "AbortError" || e.name === "CanceledError") return;
      console.error("[DonHangPage] Load employees error:", e);
      setEmployeeMap({});
    } finally {
      setEmployeeLoading(false);
    }
  };

  const loadOrders = async (signal) => {
    try {
      setLoading(true);
      setErr("");
      setMsg("");
      const data = await donhangService.getAll({}, { signal });

      const validOrders = Array.isArray(data)
        ? data.filter((order) => {
            const status = (
              order.trangThaiDonHang ||
              order.trangthaidonhang ||
              ""
            ).toLowerCase();
            return (
              status !== "cart" &&
              status !== "gio hang" &&
              status !== "giỏ hàng"
            );
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

  /**
   * FIX QUAN TRỌNG:
   * Re-load employees + orders mỗi khi user/token thay đổi
   * => logout/login xong vẫn có map NV để hiển thị.
   */
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Load employees và orders mỗi khi component mount hoặc user thay đổi
    loadEmployees(controller.signal);
    loadOrders(controller.signal);

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceReloadKey]); // Chỉ depend vào forceReloadKey để tránh loop
  
  // Thêm listener cho storage event (khi logout/login từ tab khác)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user' || e.key === 'authUser') {
        // Force reload employees khi token thay đổi
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        loadEmployees(controller.signal);
        loadOrders(controller.signal);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normStatus = (v) => {
    const s = (v || "").trim().toLowerCase();
    if (s === "chờ xác nhận") return "Chờ xác nhận";
    if (s === "chờ lấy hàng") return "Chờ lấy hàng";
    if (s === "đang giao") return "Đang giao";
    if (s === "đã giao" || s === "hoàn thành") return "Đã giao";
    if (s.includes("hủy")) return "Đã hủy";
    return v || "";
  };

  // helper hiển thị NV duyệt
  const fmtEmployee = (id) => {
    if (id == null || id === "") return "---";
    
    const keyNum = Number(id);
    
    // Nếu đang load employees và chưa có trong map
    if (employeeLoading && Object.keys(employeeMap).length === 0) {
      return `#${id}`;
    }
    
    const nv =
      employeeMap[id] || employeeMap[keyNum] || employeeMap[String(id)];
    if (!nv) {
      // Nếu không tìm thấy sau khi đã load xong
      return employeeLoading ? `#${id}` : `#${id} (không tìm thấy)`;
    }

    const name = nv.hoten ? nv.hoten.trim() : "";
    return name ? `#${nv.id} - ${name}` : `#${nv.id}`;
  };

  // filter client
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okSt = statusFilter
        ? normStatus(r.trangThaiDonHang) === statusFilter
        : true;
      if (!okSt) return false;
      if (!term) return true;

      const maNv = r.manhanvien ?? r.maNhanVien ?? "";
      const maNvText = fmtEmployee(maNv);

      const hay = [
        r.maDonHang,
        r.maKhachHang,
        r.phuongThucThanhToan,
        r.trangThaiThanhToan,
        r.trangThaiDonHang,
        maNv,
        maNvText,
        r.lydohuy,
        r.lyDoHuy,
      ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();

      return hay.includes(term);
    });
  }, [rows, q, statusFilter, employeeMap]);

  // thống kê theo trangThaiDonHang
  const stats = useMemo(() => {
    const s = {
      choxacnhan: 0,
      cholayhang: 0,
      danggiao: 0,
      dagiao: 0,
      dahuy: 0,
    };
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

  // setStatus cho phép truyền extraPayload (vd lydohuy)
  const setStatus = async (
    order,
    newStatus,
    paymentStatus,
    extraPayload = {}
  ) => {
    try {
      setUpdatingId(order.maDonHang);
      setErr("");
      setMsg("");

      const currentEmployeeId = getCurrentEmployeeId();

      const payload = {
        trangThaiDonHang: newStatus,
        ...(paymentStatus ? { trangThaiThanhToan: paymentStatus } : {}),
        ...extraPayload,
      };

      // nếu duyệt thì set mã NV duyệt
      if (newStatus === "Chờ lấy hàng" && currentEmployeeId) {
        payload.manhanvien = currentEmployeeId;
        payload.maNhanVien = currentEmployeeId; // dự phòng camelCase
      }

      // optimistic update
      setRows((prev) =>
        prev.map((r) =>
          r.maDonHang === order.maDonHang
            ? {
                ...r,
                trangThaiDonHang: newStatus,
                ...(paymentStatus
                  ? { trangThaiThanhToan: paymentStatus }
                  : {}),
                ...(extraPayload || {}),
                ...(payload.manhanvien
                  ? {
                      manhanvien: payload.manhanvien,
                      maNhanVien: payload.maNhanVien,
                    }
                  : {}),
              }
            : r
        )
      );

      const updated = await donhangService.update(
        order.maDonHang,
        payload
      );

      setRows((prev) =>
        prev.map((r) =>
          r.maDonHang === order.maDonHang ? { ...r, ...updated } : r
        )
      );
      setMsg(`Đã cập nhật đơn ${order.maDonHang} → ${newStatus}`);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Cập nhật trạng thái thất bại");
      await loadOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  // mở modal hủy
  const openCancel = (order) => {
    setCancelOrder(order);
    setCancelReason(order?.lydohuy || order?.lyDoHuy || "");
    setCancelOpen(true);
  };

  // xác nhận hủy với lý do
  const confirmCancel = async () => {
    if (!cancelOrder) return;
    const reason = cancelReason.trim();
    if (!reason) {
      setErr("Vui lòng nhập lý do hủy để thông báo cho khách.");
      return;
    }
    setCancelOpen(false);
    await setStatus(cancelOrder, "Đã hủy", null, {
      lydohuy: reason,
      lyDoHuy: reason,
    });
    setCancelOrder(null);
    setCancelReason("");
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
          {btn(
            () => setStatus(r, "Chờ lấy hàng"),
            "Duyệt",
            "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
            Check
          )}
          {btn(
            () => openCancel(r),
            "Hủy",
            "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
            XCircle
          )}
        </div>
      );
    }

    if (st === "Chờ lấy hàng") {
      return (
        <div className="flex justify-end gap-2">
          {btn(
            () => setStatus(r, "Đang giao"),
            "Giao hàng",
            "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
            Package
          )}
          {btn(
            () => openCancel(r),
            "Hủy",
            "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
            XCircle
          )}
        </div>
      );
    }

    // admin KHÔNG có nút "Đã giao"
    if (st === "Đang giao") {
      return (
        <div className="text-right text-gray-400 text-xs italic">
          Đang giao (chờ bên vận chuyển xác nhận)
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
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý đơn hàng
          </h1>
          <p className="text-gray-600">
            Quản lý các đơn hàng của khách hàng
          </p>
        </div>
      </div>

      {/* Stats quick cards (clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            key: "Chờ xác nhận",
            label: "Chờ xác nhận",
            color: "bg-yellow-500",
            value: stats.choxacnhan,
          },
          {
            key: "Chờ lấy hàng",
            label: "Chờ lấy hàng",
            color: "bg-indigo-500",
            value: stats.cholayhang,
          },
          {
            key: "Đang giao",
            label: "Đang giao",
            color: "bg-blue-500",
            value: stats.danggiao,
          },
          {
            key: "Đã giao",
            label: "Đã giao",
            color: "bg-green-500",
            value: stats.dagiao,
          },
          {
            key: "Đã hủy",
            label: "Đã hủy",
            color: "bg-red-500",
            value: stats.dahuy,
          },
        ].map((c) => {
          const active = statusFilter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setStatusFilter(active ? "" : c.key)}
              className={`text-left bg-white border rounded-xl p-3 transition-colors cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                active
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200"
              }`}
            >
              <div className="text-xs font-medium text-gray-600 flex items-center">
                <StatusDot color={c.color} /> {c.label}
              </div>
              <div className="mt-1.5 text-2xl font-bold">
                {c.value}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 border">
        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {err}
          </div>
        )}
        {msg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {msg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
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
          <div className="p-8 text-center text-gray-500">
            Đang tải...
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Chưa có đơn hàng nào
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Mã đơn
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Mã KH
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nhân viên duyệt
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Ngày đặt
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Thành tiền
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  PT thanh toán
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  TT thanh toán
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Trạng thái đơn
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {list.map((r) => {
                const maNvDuyet =
                  r.manhanvien ?? r.maNhanVien ?? null;

                return (
                  <tr
                    key={r.maDonHang}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {r.maDonHang}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {r.maKhachHang ?? ""}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {fmtEmployee(maNvDuyet)}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {fmtDate(r.ngayDatHang)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {fmtCurrency(r.thanhTien)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {r.phuongThucThanhToan ?? ""}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <Badge
                        color={
                          (r.trangThaiThanhToan || "")
                            .toLowerCase()
                            .includes("đã")
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
                          (normStatus(r.trangThaiDonHang) || "")
                            .toLowerCase()
                            .includes("hủy")
                            ? "bg-red-100 text-red-700"
                            : normStatus(r.trangThaiDonHang) ===
                              "Đã giao"
                            ? "bg-green-100 text-green-700"
                            : normStatus(r.trangThaiDonHang) ===
                              "Đang giao"
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
                        <button
                          title="Xem chi tiết"
                          onClick={() =>
                            setDetailId(r.maDonHang)
                          }
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Order detail drawer */}
      {detailId != null && (
        <OrderDetailDrawer
          orderId={detailId}
          onClose={() => setDetailId(null)}
          fmtEmployee={fmtEmployee}
        />
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

      {/* Cancel modal */}
      {cancelOpen && cancelOrder && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setCancelOpen(false)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-xl shadow-xl border p-4">
            <div className="text-lg font-semibold mb-1">
              Hủy đơn #{cancelOrder.maDonHang}
            </div>
            <div className="text-sm text-gray-600 mb-3">
              Nhập lý do để khách hàng biết vì sao đơn bị hủy.
            </div>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              placeholder="Ví dụ: Hết hàng / Không liên hệ được / Khách đổi ý..."
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCancelOpen(false)}
                className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={confirmCancel}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderDetailDrawer({ orderId, onClose, fmtEmployee }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await donhangService.getById(orderId);
        console.log('[OrderDetail Debug] Order data:', {
          magiamgia: data?.magiamgia,
          maGiamGiaInfo: data?.maGiamGiaInfo,
          maGiamGiaInfoList: data?.maGiamGiaInfoList,
          subtotal: data?.subtotal,
          thanhTien: data?.thanhTien
        });
        if (mounted) setOrder(data);
        
        // Load lịch sử
        setHistoryLoading(true);
        try {
          const logs = await lichsudonhangService.getByOrder(orderId);
          if (mounted) setHistory(logs);
        } catch (histErr) {
          console.error("Error loading history:", histErr);
        } finally {
          if (mounted) setHistoryLoading(false);
        }
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
  const subtotal = order?.subtotal || total;

  const stLower = (order?.trangThaiDonHang || "").toLowerCase();
  const maNvDuyet = order?.manhanvien ?? order?.maNhanVien ?? null;

  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/30" onClick={maskClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl border-l flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Chi tiết đơn hàng</div>
            <div className="text-xl font-semibold">Mã đơn #{orderId}</div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-gray-500">Đang tải...</div>
          ) : err ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {err}
            </div>
          ) : order ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                <Field label="Mã đơn" value={order.maDonHang} />
                <Field label="Ngày đặt" value={fmtDate(order.ngayDatHang)} />
                <Field label="PT thanh toán" value={order.phuongThucThanhToan ?? ""} />
                <Field label="TT thanh toán" value={order.trangThaiThanhToan ?? ""} />
                <Field label="Trạng thái đơn" value={order.trangThaiDonHang ?? ""} />
                {order.maGiamGiaInfo && !order.maGiamGiaInfoList && (
                  <Field 
                    label="Mã giảm giá" 
                    value={`${order.maGiamGiaInfo.magiamgia} (${order.maGiamGiaInfo.mota || 'Giảm giá'})`} 
                  />
                )}
                {order.maGiamGiaInfoList && (
                  <Field 
                    label="Mã giảm giá" 
                    value={order.maGiamGiaInfoList.map(m => m.magiamgia).join(', ')} 
                  />
                )}
                <Field label="Tổng tiền" value={fmtCurrency(order.thanhTien || total)} />
              </div>

              {/* Mã giảm giá - hiển thị chi tiết như mobile */}
              {(order.maGiamGiaInfo || order.maGiamGiaInfoList || order.freeshipInfo || order.freeshipInfoList || order.totalDiscount > 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-100 px-3 py-2 border-b border-blue-200">
                    <div className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                      <span className="text-lg">🏷️</span>
                      <span>Mã giảm giá</span>
                    </div>
                  </div>
<div className="p-3">
  {order.maGiamGiaInfoList ? (
    <div className="space-y-3">
      {order.maGiamGiaInfoList.map(code => {
        const discountAmount = code.sotiengiam || (subtotal * (code.phantramgiam || 0) / 100);
        return (
          <div key={code.magiamgia} className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="text-sm font-bold text-blue-900">{code.magiamgia}</div>
                <div className="text-xs text-gray-600 mt-0.5">{code.mota || 'Giảm giá đơn hàng'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-red-600">-{fmtCurrency(discountAmount)}</div>
                {code.phantramgiam && (
                  <div className="text-xs text-gray-500">Giảm {code.phantramgiam}% {code.giatritoithieu ? `(tối đa ${fmtCurrency(code.giatritoithieu)})` : ''}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  ) : order.maGiamGiaInfo ? (
    <div className="bg-white rounded-lg p-3 border border-blue-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="text-sm font-bold text-blue-900">{order.maGiamGiaInfo.magiamgia}</div>
          <div className="text-xs text-gray-600 mt-0.5">{order.maGiamGiaInfo.mota || 'Giảm giá đơn hàng'}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-red-600">
            -{fmtCurrency(order.maGiamGiaInfo.sotiengiam || (subtotal * (order.maGiamGiaInfo.phantramgiam || 0) / 100))}
          </div>
          {order.maGiamGiaInfo.phantramgiam && (
            <div className="text-xs text-gray-500">Giảm {order.maGiamGiaInfo.phantramgiam}%</div>
          )}
        </div>
      </div>
    </div>
  ) : order.totalDiscount > 0 ? (
    <div className="bg-white rounded-lg p-3 border border-blue-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm font-bold text-blue-900">Giảm giá đơn hàng</div>
          <div className="text-xs text-gray-600 mt-0.5">Đơn hàng cũ không có chi tiết mã giảm giá
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-red-600">
            -{fmtCurrency(order.totalDiscount)}
          </div>
        </div>
      </div>
    </div>
  ) : null}
  
  {/* Freeship vouchers - hiển thị riêng với màu xanh lá */}
  {order.freeshipInfo && (
    <div className="bg-white rounded-lg p-3 border border-green-200 mt-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm font-bold text-green-900">{order.freeshipInfo.magiamgia}</div>
          <div className="text-xs text-gray-600 mt-0.5">{order.freeshipInfo.mota || 'Miễn phí vận chuyển'}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-green-600">
            -{fmtCurrency(order.freeshipInfo.sotiengiam || ((order.phiVanChuyen || 0) * (order.freeshipInfo.phantramgiam || 0) / 100))}
          </div>
          {order.freeshipInfo.phantramgiam && (
            <div className="text-xs text-gray-500">Giảm {order.freeshipInfo.phantramgiam}% phí ship</div>
          )}
        </div>
      </div>
    </div>
  )}
  {order.freeshipInfoList && order.freeshipInfoList.map(code => (
    <div key={code.magiamgia} className="bg-white rounded-lg p-3 border border-green-200 mt-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm font-bold text-green-900">{code.magiamgia}</div>
          <div className="text-xs text-gray-600 mt-0.5">{code.mota || 'Miễn phí vận chuyển'}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-green-600">
            -{fmtCurrency(code.sotiengiam || ((order.phiVanChuyen || 0) * (code.phantramgiam || 0) / 100))}
          </div>
          {code.phantramgiam && (
            <div className="text-xs text-gray-500">Giảm {code.phantramgiam}% phí ship</div>
          )}
        </div>
      </div>
    </div>
  ))}
</div>
                </div>
              )}

              {/* lý do hủy */}
              {stLower.includes("hủy") && (order.lydohuy || order.lyDoHuy) && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
                  <div className="text-sm font-semibold mb-1">Lý do hủy</div>
                  <div className="text-sm">{order.lydohuy || order.lyDoHuy}</div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-white border rounded-lg p-3">
                  <div className="font-semibold mb-2">Khách hàng</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Field
                      label="Mã KH"
                      value={order.maKhachHang ?? order?.khachHang?.makhachhang ?? ""}
                    />
                    <Field label="Họ tên" value={order?.khachHang?.hoten ?? ""} />
                    <Field label="Email" value={order?.khachHang?.email ?? ""} />
                    <Field
                      label="SĐT"
                      value={
                        order?.khachHang?.sodienthoai ??
                        order?.diaChi?.sodienthoai ??
                        ""
                      }
                    />
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-3">
                  <div className="font-semibold mb-2">Địa chỉ giao hàng</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Field
                      label="Người nhận"
                      value={order?.diaChi?.ten ?? order?.khachHang?.hoten ?? ""}
                    />
                    <Field label="SĐT" value={order?.diaChi?.sodienthoai ?? ""} />
                    <Field label="Phường/Xã" value={order?.diaChi?.phuong ?? ""} />
                    <Field label="Tỉnh/TP" value={order?.diaChi?.tinh ?? ""} />
                    <Field
                      label="Địa chỉ cụ thể"
                      value={order?.diaChi?.diachicuthe ?? ""}
                    />
                  </div>
                </div>
              </div>

              {/* Lịch sử thay đổi */}
              <div>
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <span>📜 Lịch sử thay đổi trạng thái</span>
                  {historyLoading && <span className="text-xs text-gray-500">(đang tải...)</span>}
                </div>
                {history.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            Thời gian
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            Nhân viên
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            Trạng thái cũ
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            Trạng thái mới
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            Ghi chú
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {history.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap">
                              {fmtDate(log.thoiGian)}
                            </td>
                            <td className="px-3 py-2">
                              {fmtEmployee(log.maNhanVien)}
                            </td>
                            <td className="px-3 py-2">
                              {log.trangThaiCu || "---"}
                            </td>
                            <td className="px-3 py-2 font-medium">
                              {log.trangThaiMoi || "---"}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {log.ghiChu || ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm italic">
                    Chưa có lịch sử thay đổi
                  </div>
                )}
              </div>

              <div>
                <div className="font-semibold mb-2">Sản phẩm</div>
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            Sản phẩm
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            Phân loại
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                            Đơn giá
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">
                            Số lượng
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                            Thành tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {order.items.map((it) => {
                          const promo = it.promotion || null;
                          const discount = promo?.discount || null;
                          const gift = promo?.gift || null;
                          const hasDiscount = !!discount;
                          const hasGift = !!gift;
                          if (promo) {
                            console.log('[FE Promotion Debug]', {
                              itemId: it.maChiTietDonHang,
                              variantId: it.maChiTietSanPham,
                              discount,
                              gift
                            });
                          }
                          return (
                            <React.Fragment key={it.maChiTietDonHang}>
                              <tr>
                                <td className="px-3 py-2 text-sm">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={it.imageUrl}
                                      alt="sp"
                                      className="w-12 h-12 object-cover rounded border"
                                      onError={(e) => {
                                        e.currentTarget.style.visibility = "hidden";
                                      }}
                                    />
                                    <div>
                                      <div className="font-medium">
                                        {it.productName ?? `CTSP #${it.maChiTietSanPham}`}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Mã CTSP: {it.maChiTietSanPham}
                                      </div>
                                      {hasDiscount && (
                                        <div className="text-xs text-green-600 font-medium mt-1">
                                          🎉 Giảm {discount.phantramgiam ? `${discount.phantramgiam}%` : fmtCurrency(discount.sotiengiam)}
                                          {discount.tenkhuyenmai && (
                                            <span className="ml-1 italic text-green-700">({discount.tenkhuyenmai})</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  <div>Màu: {it?.variant?.color ?? "---"}</div>
                                  <div>Size: {it?.variant?.size ?? "---"}</div>
                                </td>
                                <td className="px-3 py-2 text-sm text-right">
                                  {hasDiscount ? (
                                    <div>
                                      <div className="line-through text-gray-400 text-xs">
                                        {fmtCurrency(it?.variant?.price || it.donGia)}
                                      </div>
                                      <div className="text-green-600 font-semibold">
                                        {fmtCurrency(it.donGia)}
                                      </div>
                                    </div>
                                  ) : (
                                    fmtCurrency(it.donGia)
                                  )}
                                </td>
                                <td className="px-3 py-2 text-sm text-center">
                                  {it.soLuong}
                                </td>
                                <td className="px-3 py-2 text-sm text-right">
                                  {fmtCurrency(
                                    it.thanhTien ??
                                      Number(it.soLuong) * Number(it.donGia)
                                  )}
                                </td>
                              </tr>
                              {hasGift && (
                                <tr className="bg-green-50">
                                  <td colSpan={5} className="px-3 py-2">
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0">
                                        <img
                                          src={gift.imageUrl}
                                          alt="gift"
                                          className="w-12 h-12 object-cover rounded border"
                                          onError={(e) => {
                                            e.currentTarget.style.visibility = 'hidden';
                                          }}
                                        />
                                      </div>
                                      <div className="flex-1 text-sm">
                                        <div className="font-semibold text-green-800 mb-0.5">
                                          🎁 Sản phẩm tặng kèm
                                        </div>
                                        <div className="text-green-700 flex flex-wrap gap-x-4 gap-y-0.5">
                                          <span>Tên: {gift.tensanphamtang || gift.tensanpham || `#${gift.masanphamtang}`}</span>
                                          <span>Màu: {gift.mausac || '---'}</span>
                                          <span>Size: {gift.kichthuoc || '---'}</span>
                                          <span>Số lượng: {gift.soluongtang || 1}</span>
                                        </div>
                                        {gift.tenkhuyenmai && (
                                          <div className="text-xs text-green-600 italic mt-1">"{gift.tenkhuyenmai}"</div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-sm text-right">
                            Tổng tiền hàng:
                          </td>
                          <td className="px-3 py-2 text-sm text-right font-medium">
                            {fmtCurrency(subtotal)}
                          </td>
                        </tr>
                        {/* Hiển thị mã giảm giá chi tiết như mobile - Tách discount và freeship */}
                        {order.maGiamGiaInfo && !order.maGiamGiaInfoList && (
                          <tr className="text-red-600">
                            <td colSpan={4} className="px-3 py-2 text-sm text-right">
                              <div>Giảm giá đơn hàng</div>
                              <div className="text-xs text-gray-500 font-normal">{order.maGiamGiaInfo.magiamgia}</div>
                              {order.maGiamGiaInfo.mota && (
                                <div className="text-xs text-gray-400 font-normal">{order.maGiamGiaInfo.mota}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium">
                              -{fmtCurrency(order.maGiamGiaInfo.sotiengiam || (subtotal * (order.maGiamGiaInfo.phantramgiam || 0) / 100))}
                            </td>
                          </tr>
                        )}
                        {order.maGiamGiaInfoList && order.maGiamGiaInfoList.map(code => (
                          <tr key={code.magiamgia} className="text-red-600">
                            <td colSpan={4} className="px-3 py-2 text-sm text-right">
                              <div>Giảm giá đơn hàng</div>
                              <div className="text-xs text-gray-500 font-normal">{code.magiamgia}</div>
                              {code.mota && (
                                <div className="text-xs text-gray-400 font-normal">{code.mota}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium">
                              -{fmtCurrency(code.sotiengiam || (subtotal * (code.phantramgiam || 0) / 100))}
                            </td>
                          </tr>
                        ))}
                        {/* Giảm giá tổng thể cho đơn hàng cũ */}
                        {order.totalDiscount > 0 && !order.maGiamGiaInfo && !order.maGiamGiaInfoList && !order.freeshipInfo && (
                          <tr className="text-red-600">
                            <td colSpan={4} className="px-3 py-2 text-sm text-right">
                              <div>Giảm giá đơn hàng</div>
                              <div className="text-xs text-gray-500 font-normal">Đơn hàng cũ</div>
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium">
                              -{fmtCurrency(order.totalDiscount)}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-sm text-right">
                            Phí vận chuyển:
                          </td>
                          <td className="px-3 py-2 text-sm text-right font-medium">
                            {fmtCurrency(order.phiVanChuyen || 0)}
                          </td>
                        </tr>
                        {/* Giảm phí vận chuyển - Hiển thị mã freeship riêng với màu xanh */}
                        {order.freeshipInfo && (
                          <tr className="text-green-600">
                            <td colSpan={4} className="px-3 py-2 text-sm text-right">
                              <div>Giảm phí vận chuyển</div>
                              <div className="text-xs text-gray-500 font-normal">{order.freeshipInfo.magiamgia}</div>
                              {order.freeshipInfo.mota && (
                                <div className="text-xs text-gray-400 font-normal italic">{order.freeshipInfo.mota}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium">
                              -{fmtCurrency(order.freeshipInfo.sotiengiam || ((order.phiVanChuyen || 0) * (order.freeshipInfo.phantramgiam || 0) / 100))}
                            </td>
                          </tr>
                        )}
                        {order.freeshipInfoList && order.freeshipInfoList.map(code => (
                          <tr key={code.magiamgia} className="text-green-600">
                            <td colSpan={4} className="px-3 py-2 text-sm text-right">
                              <div>Giảm phí vận chuyển</div>
                              <div className="text-xs text-gray-500 font-normal">{code.magiamgia}</div>
                              {code.mota && (
                                <div className="text-xs text-gray-400 font-normal italic">{code.mota}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium">
                              -{fmtCurrency(code.sotiengiam || ((order.phiVanChuyen || 0) * (code.phantramgiam || 0) / 100))}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2">
                          <td colSpan={4} className="px-3 py-2 text-sm text-right font-bold">
                            Tổng thanh toán:
                          </td>
                          <td className="px-3 py-2 text-sm text-right font-bold text-lg text-blue-600">
                            {fmtCurrency(order.thanhTien || total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    Đơn hàng chưa có chi tiết.
                  </div>
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
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-gray-500">Đang tải...</div>
          ) : err ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {err}
            </div>
          ) : rows && rows.length > 0 ? (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.maTraHang || r.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between">
                    <div className="font-medium">Yêu cầu #{r.maTraHang ?? r.id}</div>
                    <div className="text-sm text-gray-500">{r.trangThai ?? r.trangthai ?? ""}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Đơn: {r.maDonHang ?? ""} • KH: {r.maKhachHang ?? ""}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Sản phẩm: {r.maChiTietSanPham ?? ""} • Số lượng: {r.soLuong}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Lý do: {r.lyDo ?? r.lydo ?? ""}
                  </div>
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
