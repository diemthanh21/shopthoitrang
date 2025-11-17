import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, RefreshCcw, Search } from "lucide-react";

import trahangService from "../services/trahangService";

const STATUS_META = {
  cho_duyet: { label: "Chờ duyệt", color: "bg-amber-50 text-amber-700 border-amber-200" },
  da_duyet_cho_gui_hang: {
    label: "Đã duyệt - chờ gửi",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  da_nhan_hang_cho_kiem_tra: {
    label: "Đã nhận - chờ kiểm tra",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  du_dieu_kien_hoan_tien: {
    label: "Đủ điều kiện hoàn tiền",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  da_hoan_tien: { label: "Đã hoàn tiền", color: "bg-blue-50 text-blue-700 border-blue-200" },
  khong_hop_le: { label: "Không hợp lệ", color: "bg-rose-50 text-rose-700 border-rose-200" },
  tu_choi: { label: "Từ chối", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

const STATUS_SELECT = [
  { value: "", label: "Tất cả trạng thái" },
  ...Object.entries(STATUS_META).map(([key, meta]) => ({
    value: key,
    label: meta.label,
  })),
];

const STATUS_ORDER = [
  "cho_duyet",
  "da_duyet_cho_gui_hang",
  "da_nhan_hang_cho_kiem_tra",
  "du_dieu_kien_hoan_tien",
  "da_hoan_tien",
  "khong_hop_le",
  "tu_choi",
];

const sanitizeStatus = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const resolveStatusKey = (value) => {
  const normalized = sanitizeStatus(value);
  if (STATUS_META[normalized]) return normalized;
  if (normalized?.includes("cho_duyet")) return "cho_duyet";
  if (normalized?.includes("duyet_cho_gui")) return "da_duyet_cho_gui_hang";
  if (normalized?.includes("nhan_hang")) return "da_nhan_hang_cho_kiem_tra";
  if (normalized?.includes("du_dieu_kien")) return "du_dieu_kien_hoan_tien";
  if (normalized?.includes("hoan_tien")) return "da_hoan_tien";
  if (normalized?.includes("khong_hop_le")) return "khong_hop_le";
  if (normalized?.includes("tu_choi")) return "tu_choi";
  return null;
};

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
};

const StatusBadge = ({ code }) => {
  const colorMap = {
    cho_duyet: "bg-yellow-100 text-yellow-700 border-yellow-200",
    da_duyet_cho_gui_hang: "bg-blue-100 text-blue-700 border-blue-200",
    da_nhan_hang_cho_kiem_tra: "bg-purple-100 text-purple-700 border-purple-200",
    du_dieu_kien_hoan_tien: "bg-green-100 text-green-700 border-green-200",
    da_hoan_tien: "bg-blue-100 text-blue-700 border-blue-200",
    khong_hop_le: "bg-red-100 text-red-700 border-red-200",
    tu_choi: "bg-red-100 text-red-700 border-red-200",
  };
  const meta = STATUS_META[code] || {
    label: "Chưa rõ",
    color: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorMap[code] || meta.color}`}>
      {meta.label}
    </span>
  );
};

const ActionButton = ({ tone = "sky", onClick, children, icon: Icon }) => {
  const toneClass =
    {
      sky: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
      emerald: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
      rose: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
      amber: "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
      cyan: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
    }[tone] || "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${toneClass}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
};

export default function TraHangPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
  });

  const [dialog, setDialog] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (filters.status) params.trangthai = filters.status.toUpperCase();
      const data = await trahangService.getAll(params);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.status]);

  const counts = useMemo(() => {
    const counter = { total: items.length };
    items.forEach((item) => {
      const key = resolveStatusKey(item.trangThai);
      if (!key) return;
      counter[key] = (counter[key] || 0) + 1;
    });
    return counter;
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = filters.keyword.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const haystack = [
        item.maTraHang,
        item.maDonHang,
        item.maKhachHang,
        item.maChiTietSanPham,
        item.lyDo,
        item.trangThai,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [filters.keyword, items]);

  const openDialog = (type, id) => setDialog({ type, id });
  const closeDialog = () => setDialog(null);

  const runAndReload = async (fn) => {
    try {
      await fn();
      await load();
    } catch (err) {
      window.alert(
        err?.response?.data?.message || err?.message || "Không thể xử lý yêu cầu"
      );
    }
  };

  const submitDialog = async (event) => {
    event.preventDefault();
    if (!dialog) return;
    const formData = new FormData(event.target);
    if (dialog.type === "accept") {
      await runAndReload(() =>
        trahangService.accept(dialog.id, formData.get("diachi"))
      );
    } else {
      await runAndReload(() =>
        trahangService.reject(dialog.id, formData.get("lydo"))
      );
    }
    closeDialog();
  };

  const renderActions = (item) => {
    const key = resolveStatusKey(item.trangThai);
    const id = item.maTraHang || item.id;
    switch (key) {
      case "cho_duyet":
        return (
          <div className="flex flex-wrap gap-2">
            <ActionButton tone="sky" onClick={() => openDialog("accept", id)}>
              Duyệt
            </ActionButton>
            <ActionButton tone="rose" onClick={() => openDialog("reject", id)}>
              Từ chối
            </ActionButton>
          </div>
        );
      case "da_duyet_cho_gui_hang":
        return (
          <ActionButton tone="amber" onClick={() => runAndReload(() => trahangService.markReceived(id))}>
            Đã nhận hàng
          </ActionButton>
        );
      case "da_nhan_hang_cho_kiem_tra":
        return (
          <div className="flex flex-wrap gap-2">
            <ActionButton tone="emerald" onClick={() => runAndReload(() => trahangService.markValid(id))}>
              Hợp lệ
            </ActionButton>
            <ActionButton tone="rose" onClick={() => runAndReload(() => trahangService.markInvalid(id, "Không đạt điều kiện"))}>
              Không hợp lệ
            </ActionButton>
          </div>
        );
      case "du_dieu_kien_hoan_tien":
        return (
          <div className="flex flex-wrap gap-2">
            <ActionButton tone="cyan" onClick={() => runAndReload(() => trahangService.calcRefund(id))}>
              Tính tiền hoàn
            </ActionButton>
            <ActionButton tone="sky" onClick={() => runAndReload(() => trahangService.refund(id, "GATEWAY"))}>
              Hoàn tiền
            </ActionButton>
          </div>
        );
      default:
        return <span className="text-xs text-gray-400">Không có hành động</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Title */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600">
            <RefreshCcw size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý trả hàng</h1>
            <p className="mt-1 text-sm text-gray-500">Quản lý các đơn trả hàng của khách hàng</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setFilters((prev) => ({ ...prev, status: "" }))}
          className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
            !filters.status
              ? "border-blue-600 bg-blue-600 text-white shadow-sm"
              : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <div className={`h-2 w-2 rounded-full ${!filters.status ? "bg-white" : "bg-gray-400"}`}></div>
          <span>Tất cả</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            !filters.status ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
          }`}>
            {counts.total || 0}
          </span>
        </button>

        {STATUS_ORDER.map((code) => {
          const meta = STATUS_META[code];
          const isActive = filters.status === code;
          const colorMap = {
            cho_duyet: { 
              dot: "bg-yellow-400", 
              activeBg: "border-yellow-500 bg-yellow-500", 
              inactiveBg: "border-yellow-200 bg-yellow-50",
              text: "text-yellow-700",
              activeText: "text-white",
              badge: "bg-yellow-100"
            },
            da_duyet_cho_gui_hang: { 
              dot: "bg-cyan-400", 
              activeBg: "border-cyan-500 bg-cyan-500", 
              inactiveBg: "border-cyan-200 bg-cyan-50",
              text: "text-cyan-700",
              activeText: "text-white",
              badge: "bg-cyan-100"
            },
            da_nhan_hang_cho_kiem_tra: { 
              dot: "bg-purple-400", 
              activeBg: "border-purple-500 bg-purple-500", 
              inactiveBg: "border-purple-200 bg-purple-50",
              text: "text-purple-700",
              activeText: "text-white",
              badge: "bg-purple-100"
            },
            du_dieu_kien_hoan_tien: { 
              dot: "bg-green-400", 
              activeBg: "border-green-500 bg-green-500", 
              inactiveBg: "border-green-200 bg-green-50",
              text: "text-green-700",
              activeText: "text-white",
              badge: "bg-green-100"
            },
            da_hoan_tien: { 
              dot: "bg-blue-400", 
              activeBg: "border-blue-500 bg-blue-500", 
              inactiveBg: "border-blue-200 bg-blue-50",
              text: "text-blue-700",
              activeText: "text-white",
              badge: "bg-blue-100"
            },
            khong_hop_le: { 
              dot: "bg-red-400", 
              activeBg: "border-red-500 bg-red-500", 
              inactiveBg: "border-red-200 bg-red-50",
              text: "text-red-700",
              activeText: "text-white",
              badge: "bg-red-100"
            },
            tu_choi: { 
              dot: "bg-rose-400", 
              activeBg: "border-rose-500 bg-rose-500", 
              inactiveBg: "border-rose-200 bg-rose-50",
              text: "text-rose-700",
              activeText: "text-white",
              badge: "bg-rose-100"
            },
          };
          const colors = colorMap[code];
          
          return (
            <button
              key={code}
              onClick={() => setFilters((prev) => ({ ...prev, status: code }))}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? `${colors.activeBg} ${colors.activeText} shadow-sm`
                  : `${colors.inactiveBg} ${colors.text} hover:shadow-sm`
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${isActive ? "bg-white" : colors.dot}`}></div>
              <span>{meta.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                isActive ? "bg-white/20 text-white" : `${colors.badge} text-gray-700`
              }`}>
                {counts[code] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.keyword}
            onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            placeholder="Tìm kiếm đơn hàng..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-64"
        >
          {STATUS_SELECT.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={load}
          className="flex items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <RefreshCcw size={16} /> Làm mới
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Mã Phiếu
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Mã Đơn
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Mã KH
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Sản phẩm
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Lý do
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Ngày yêu cầu
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                    Không có phiếu nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const statusKey = resolveStatusKey(item.trangThai);
                  return (
                    <tr key={item.maTraHang || item.id} className="transition hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.maTraHang ?? item.id}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/donhang/${item.maDonHang}`}
                          className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
                        >
                          {item.maDonHang}
                          <ArrowUpRight size={14} />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.maKhachHang ?? "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">CTSP #{item.maChiTietSanPham ?? "?"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.lyDo || "Không rõ"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge code={statusKey} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(item.ngayYeuCau)}</td>
                      <td className="px-4 py-3">{renderActions(item)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Modal */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form
            onSubmit={submitDialog}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase text-blue-600">
                {dialog.type === "accept" ? "duyệt yêu cầu" : "từ chối yêu cầu"}
              </p>
              <h3 className="mt-1 text-xl font-bold text-gray-900">Phiếu #{dialog.id}</h3>
            </div>
            {dialog.type === "accept" ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Địa chỉ nhận hàng
                </label>
                <input
                  name="diachi"
                  required
                  defaultValue="Kho A - 123 Địa chỉ trả hàng"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-xs text-gray-500">
                  Khách sẽ gửi sản phẩm về địa chỉ này.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Lý do từ chối
                </label>
                <textarea
                  name="lydo"
                  required
                  className="min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Mô tả lý do cụ thể..."
                />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                type="submit"
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  dialog.type === "accept"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {dialog.type === "accept" ? "Duyệt yêu cầu" : "Từ chối"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}