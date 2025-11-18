// src/pages/PhieuNhapKhoPage.jsx
import { useEffect, useMemo, useState } from "react";
import { FileText, Search, Eye, Plus, X, Save, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import phieuNhapKhoService from "../services/phieunhapkhoService";
import phieuDatHangService from "../services/phieuDatHangService";
import nhanvienService from "../services/nhanvienService";
import nhacungcapService from "../services/nhacungcapService";

// Format helpers
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN") : "";

function StatusDot({ color }) {
  return <span className={`inline-block w-2 h-2 rounded-full mr-2 ${color}`} />;
}

function Badge({ children, color }) {
  return (
    <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${color}`}>
      {children}
    </span>
  );
}

// Helper: Lấy màu theo trạng thái
function getStatusColor(status) {
  const sLower = (status || "").toLowerCase();
  
  if (sLower.includes("hủy")) {
    return "bg-red-100 text-red-700";
  } else if (sLower.includes("duyệt")) {
    return "bg-green-100 text-green-700";
  } else if (sLower.includes("chờ") || sLower.includes("xác")) {
    return "bg-yellow-100 text-yellow-700";
  } else if (sLower.includes("hoàn thành")) {
    return "bg-purple-100 text-purple-700";
  }
  // Mặc định (Tạo mới / không rõ): dùng xanh biển
  return "bg-blue-100 text-blue-700";
}

// Helper: Normalize status for filtering
function normalizeStatus(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("tạo")) return "tao-moi";
  if (s.includes("chờ") || s.includes("xác")) return "cho-xac-nhan";
  if (s.includes("duyệt")) return "da-duyet";
  if (s.includes("hủy")) return "da-huy";
  return "other";
}

export default function PhieuNhapKhoPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Filter state

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addFormData, setAddFormData] = useState({
    maPhieuDatHang: "",
    maNhanVien: "",
    ngayNhap: new Date().toISOString().split("T")[0],
    ghiChu: "",
  });

  // ===== Load danh sách phiếu + NV + NCC =====
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const [p, emps, orders, nccs] = await Promise.all([
          phieuNhapKhoService.getAll(),
          nhanvienService.getAll(),
          phieuDatHangService.getAll(),
          nhacungcapService.getAll(),
        ]);

        setRows(Array.isArray(p) ? p : p?.data ?? []);
        setEmployees(Array.isArray(emps) ? emps : emps?.data ?? []);
        setPurchaseOrders(Array.isArray(orders) ? orders : orders?.data ?? []);
        setSuppliers(Array.isArray(nccs) ? nccs : nccs?.data ?? []);
      } catch (e) {
        console.error(e);
        setRows([]);
        setEmployees([]);
        setPurchaseOrders([]);
        setSuppliers([]);
        setErr("Không thể tải danh sách phiếu nhập kho / phiếu đặt hàng / nhân viên / nhà cung cấp");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ===== Helper: id -> tên nhân viên =====
  function getTenNhanVien(maNhanVien) {
    if (!maNhanVien) return "";
    const found = employees.find(
      (e) =>
        e.maNhanVien === maNhanVien ||
        e.manhanvien === maNhanVien ||
        Number(e.maNhanVien ?? e.manhanvien) === Number(maNhanVien)
    );
    return found?.hoTen ?? found?.hoten ?? `#${maNhanVien}`;
  }

  // ===== Helper: id -> tên nhà cung cấp =====
  function getTenNhaCungCap(maNCC) {
    if (!maNCC) return "";
    const found = suppliers.find(
      (s) =>
        s.maNhaCungCap === maNCC ||
        s.manhacungcap === maNCC ||
        Number(s.maNhaCungCap ?? s.manhacungcap) === Number(maNCC)
    );
    return found?.tenNhaCungCap ?? found?.tennhacungcap ?? `#${maNCC}`;
  }

  const purchaseOrderMap = useMemo(() => {
    const map = new Map();
    purchaseOrders.forEach((order) => {
      const id = Number(order.maPhieuDatHang ?? order.maphieudathang);
      if (!Number.isNaN(id)) {
        map.set(id, order);
      }
    });
    return map;
  }, [purchaseOrders]);

  const getPurchaseOrderById = (value) => {
    if (!value) return null;
    const id = Number(value);
    if (Number.isNaN(id)) return null;
    return purchaseOrderMap.get(id) ?? null;
  };

  const getSupplierIdFromRow = (row) => {
    if (!row) return null;
    const direct = row.maNhaCungCap ?? row.manhacungcap ?? null;
    if (direct) return direct;
    const order = getPurchaseOrderById(row.maPhieuDatHang ?? row.maphieudathang);
    return order?.maNhaCungCap ?? order?.manhacungcap ?? null;
  };

  const getSupplierNameFromRow = (row) => getTenNhaCungCap(getSupplierIdFromRow(row));

  const getOrderLabel = (row) => {
    const id = row?.maPhieuDatHang ?? row?.maphieudathang;
    return id ? `${id}` : "-";
  };

  const eligibleOrders = useMemo(() => {
    if (!purchaseOrders.length) return [];
    return purchaseOrders.filter((order) => {
      const status = (
        order.trangThaiPhieu ??
        order.trangthaiphieu ??
        ""
      )
        .toString()
        .toLowerCase();
      return status.includes("duy") || status.includes("approve");
    });
  }, [purchaseOrders]);

  const selectedOrder = useMemo(
    () => getPurchaseOrderById(addFormData.maPhieuDatHang),
    [addFormData.maPhieuDatHang, purchaseOrderMap]
  );

  const selectedSupplier = useMemo(() => {
    if (!selectedOrder) return { id: "", name: "" };
    const id =
      selectedOrder.maNhaCungCap ??
      selectedOrder.manhacungcap ??
      "";
    const name = getTenNhaCungCap(id);
    return { id, name };
  }, [selectedOrder]);

  // ===== Filter client-side =====
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();

    let filtered = rows.filter((r) => {
      // Filter by status
      if (statusFilter !== "all") {
        const normalized = normalizeStatus(r.trangThai);
        if (normalized !== statusFilter) return false;
      }

      // Filter by search term
      if (!term) return true;

      const hay = [
        r.maPhieuNhap,
        getOrderLabel(r),
        getSupplierNameFromRow(r),
        getTenNhanVien(r.maNhanVien),
        r.ghiChu,
        r.trangThai,
      ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();

      return hay.includes(term);
    });
    
    // Sắp xếp theo mã phiếu nhập kho giảm dần
    filtered.sort((a, b) => {
      const maA = a.maPhieuNhap ?? 0;
      const maB = b.maPhieuNhap ?? 0;
      return Number(maB) - Number(maA);
    });
    
    return filtered;
  }, [rows, q, statusFilter, employees, suppliers, purchaseOrders]);
  
  // ===== Pagination =====
  const totalPages = Math.ceil(list.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = list.slice(startIndex, startIndex + itemsPerPage);

  // Reset về trang 1 khi search hoặc filter
  useEffect(() => {
    setCurrentPage(1);
  }, [q, statusFilter]);

  // ===== Thống kê theo trạng thái =====
  const stats = useMemo(() => {
    const s = { taoMoi: 0, choXacNhan: 0, daDuyet: 0, daHuy: 0 };

    for (const r of rows) {
      const normalized = normalizeStatus(r.trangThai);
      
      if (normalized === "tao-moi") s.taoMoi++;
      else if (normalized === "cho-xac-nhan") s.choXacNhan++;
      else if (normalized === "da-duyet") s.daDuyet++;
      else if (normalized === "da-huy") s.daHuy++;
    }

    return s;
  }, [rows]);

  // ===== Xem chi tiết phiếu =====
  const handleViewDetail = (row) => {
    const id = row.maPhieuNhap;
    if (!id) return;
    navigate(`/phieunhapkho/${id}`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý phiếu nhập kho</h1>
          </div>
        </div>
        <button
          onClick={() => {
            setAddFormData({
              maPhieuDatHang: "",
              maNhanVien: "",
              ngayNhap: new Date().toISOString().split("T")[0],
              ghiChu: "",
            });
            setShowAddForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm phiếu nhập kho
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter("tao-moi")}
          className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
            statusFilter === "tao-moi" ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
          }`}
        >
          <div className="text-sm font-medium text-blue-600 flex items-center">
            <StatusDot color="bg-blue-500" /> Tạo mới
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.taoMoi}</div>
        </div>
        
        <div 
          onClick={() => setStatusFilter("cho-xac-nhan")}
          className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
            statusFilter === "cho-xac-nhan" ? "ring-2 ring-yellow-500 shadow-lg" : "hover:shadow-md"
          }`}
        >
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-yellow-500" /> Chờ xác nhận
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.choXacNhan}</div>
        </div>
        
        <div 
          onClick={() => setStatusFilter("da-duyet")}
          className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
            statusFilter === "da-duyet" ? "ring-2 ring-green-500 shadow-lg" : "hover:shadow-md"
          }`}
        >
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-green-500" /> Đã duyệt
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.daDuyet}</div>
        </div>
        
        <div 
          onClick={() => setStatusFilter("da-huy")}
          className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
            statusFilter === "da-huy" ? "ring-2 ring-red-500 shadow-lg" : "hover:shadow-md"
          }`}
        >
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-red-500" /> Đã hủy
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.daHuy}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 border">
        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {err}
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
              placeholder="Tìm kiếm phiếu (mã phiếu, nhà cung cấp, nhân viên, trạng thái...)"
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="relative min-w-[200px]">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="tao-moi">Tạo mới</option>
              <option value="cho-xac-nhan">Chờ xác nhận</option>
              <option value="da-duyet">Đã duyệt</option>
              <option value="da-huy">Đã hủy</option>
            </select>
          </div>
          
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {statusFilter !== "all" || q.trim() 
              ? "Không tìm thấy phiếu nhập kho nào phù hợp"
              : "Chưa có phiếu nhập kho nào"
            }
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Mã phiếu nhập
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Phiếu đặt hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nhà cung cấp
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nhân viên nhập
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Ngày nhập
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Ghi chú
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedData.map((r) => {
                const status = r.trangThai || "Tạo mới";
                const badgeColor = getStatusColor(status);

                return (
                  <tr key={r.maPhieuNhap} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {r.maPhieuNhap}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {getOrderLabel(r)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getSupplierNameFromRow(r)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getTenNhanVien(r.maNhanVien)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {fmtDate(r.ngayNhap)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge color={badgeColor}>{status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                      {r.ghiChu ?? ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewDetail(r)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Eye size={18} />
                        <span>Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                Trước
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    const distance = Math.abs(page - currentPage);
                    return distance <= 1 || page === 1 || page === totalPages;
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showDots = prevPage && page - prevPage > 1;
                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showDots && (
                          <span className="px-2 py-1 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiếp
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal form thêm phiếu nhập kho */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Thêm phiếu nhập kho mới
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setSaving(true);

                  // Validate
                  if (!addFormData.maPhieuDatHang) {
                    alert("Vui lòng chọn phiếu đặt hàng!");
                    return;
                  }
                  if (!addFormData.maNhanVien) {
                    alert("Vui lòng chọn nhân viên nhập!");
                    return;
                  }
                  if (!addFormData.ngayNhap) {
                    alert("Vui lòng chọn ngày nhập!");
                    return;
                  }

                  const payload = {
                    maNhanVien: Number(addFormData.maNhanVien),
                    maPhieuDatHang: Number(addFormData.maPhieuDatHang),
                    ngayNhap: addFormData.ngayNhap,
                    ghiChu: addFormData.ghiChu || null,
                    trangThai: "Tạo mới",
                  };

                  const res = await phieuNhapKhoService.create(payload);

                  // Reload list
                  const newList = await phieuNhapKhoService.getAll();
                  setRows(Array.isArray(newList) ? newList : newList?.data ?? []);

                  setShowAddForm(false);
                  alert("Thêm phiếu nhập kho thành công!");

                  // Navigate to detail page
                  if (res?.maPhieuNhap) {
                    navigate(`/phieunhapkho/${res.maPhieuNhap}`);
                  }
                } catch (error) {
                  console.error("Lỗi khi thêm phiếu nhập kho:", error);
                  alert(
                    "Có lỗi xảy ra khi thêm phiếu nhập kho! " +
                      (error.response?.data?.message || error.message || "")
                  );
                } finally {
                  setSaving(false);
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phiếu đặt hàng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addFormData.maPhieuDatHang}
                    onChange={(e) =>
                      setAddFormData((old) => ({
                        ...old,
                        maPhieuDatHang: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Chọn phiếu đặt hàng --</option>
                    {eligibleOrders.map((order) => {
                      const id = order.maPhieuDatHang ?? order.maphieudathang;
                      const supplierId = order.maNhaCungCap ?? order.manhacungcap;
                      const supplierName =
                        getTenNhaCungCap(supplierId) ||
                        (supplierId ? `${supplierId}` : "Không rõ NCC");
                      return (
                        <option key={id} value={id}>
                          #{id} - {supplierName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhà cung cấp
                  </label>
                  <input
                    type="text"
                    value={
                      selectedSupplier.name ||
                      (selectedSupplier.id ? `#${selectedSupplier.id}` : "")
                    }
                    readOnly
                    placeholder="Tự động theo phiếu đặt hàng"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhân viên nhập <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addFormData.maNhanVien}
                    onChange={(e) =>
                      setAddFormData((old) => ({
                        ...old,
                        maNhanVien: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.map((e) => (
                      <option
                        key={e.maNhanVien ?? e.manhanvien}
                        value={e.maNhanVien ?? e.manhanvien}
                      >
                        {e.hoTen ?? e.hoten}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={addFormData.ngayNhap}
                    onChange={(e) =>
                      setAddFormData((old) => ({
                        ...old,
                        ngayNhap: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={addFormData.ghiChu}
                  onChange={(e) =>
                    setAddFormData((old) => ({
                      ...old,
                      ghiChu: e.target.value,
                    }))
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}