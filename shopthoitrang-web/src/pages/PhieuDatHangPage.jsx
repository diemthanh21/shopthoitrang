// src/pages/PhieuDatHangPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Search, Eye, Plus, X, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import phieuDatHangService from "../services/phieuDatHangService";
import nhanvienService from "../services/nhanvienService";
import nhacungcapService from "../services/nhacungcapService";

// Format helpers
const fmtCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "");

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

export default function PhieuDatHangPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addFormData, setAddFormData] = useState({
    maNhaCungCap: "",
    maNhanVien: "",
    ngayHenDuKien: "",
    tienCoc: "",
    phuongThucThanhToan: "",
    ghiChu: "",
  });

  const abortRef = useRef(null);

  // ===== Load danh sách phiếu + NV + NCC =====
  useEffect(() => {
    // đơn giản hoá: không cần AbortController nếu service không hỗ trợ signal
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // Load suppliers first to ensure they're available
        const nccs = await nhacungcapService.getAll();
        console.log('Loaded suppliers:', nccs);
        
        if (!Array.isArray(nccs) || nccs.length === 0) {
          console.warn('No suppliers loaded or invalid response');
          setErr("Không thể tải danh sách nhà cung cấp");
          return;
        }

        setSuppliers(nccs);

        // Then load the rest
        const [p, emps] = await Promise.all([
          phieuDatHangService.getAll(),
          nhanvienService.getAll(),
        ]);

        console.log('Loaded data:', {
          orders: p,
          employees: emps,
          currentSuppliers: nccs
        });

        setRows(Array.isArray(p) ? p : []);
        setEmployees(Array.isArray(emps) ? emps : []);
      } catch (e) {
        console.error(e);
        setRows([]);
        setEmployees([]);
        setSuppliers([]);
        setErr("Không thể tải danh sách phiếu đặt hàng / nhân viên / nhà cung cấp");
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
    
    // Find supplier with exact ID match
    const found = suppliers.find(s => s.maNhaCungCap === maNCC);
    
    // Log for debugging
    console.log('Finding supplier:', {
      searchId: maNCC,
      suppliers: suppliers,
      found: found
    });

    return found ? found.tenNhaCungCap : `#${maNCC}`;
  }

  // ===== Filter client-side =====
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();

    let filtered = rows.filter((r) => {
      const okSt = statusFilter ? r.trangThaiPhieu === statusFilter : true;
      if (!okSt) return false;

      if (!term) return true;

      const hay = [
        r.maPhieuDatHang ?? r.maphieudathang,
        getTenNhaCungCap(r.manhacungcap ?? r.maNhaCungCap),
        getTenNhanVien(r.manhanvien ?? r.maNhanVien),
        r.phuongThucThanhToan ?? r.phuongthucthanhtoan,
        r.trangThaiPhieu ?? r.trangthaiphieu,
      ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();

      return hay.includes(term);
    });
    
    // Sắp xếp theo mã phiếu đặt hàng giảm dần
    filtered.sort((a, b) => {
      const maA = a.maPhieuDatHang ?? a.maphieudathang ?? 0;
      const maB = b.maPhieuDatHang ?? b.maphieudathang ?? 0;
      return Number(maB) - Number(maA);
    });
    
    return filtered;
  }, [rows, q, statusFilter, employees, suppliers]);
  
  // ===== Pagination =====
  const totalPages = Math.ceil(list.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = list.slice(startIndex, startIndex + itemsPerPage);

  // Reset về trang 1 khi search hoặc filter
  useEffect(() => {
    setCurrentPage(1);
  }, [q, statusFilter]);

  // ===== Thống kê theo trạng thái phiếu =====
  const stats = useMemo(() => {
    const s = { cho: 0, daduyet: 0, daxong: 0, dahuy: 0};

    for (const r of rows) {
      const v = (r.trangThaiPhieu || r.trangthaiphieu || "").toLowerCase();
      if (v.includes("chờ")) s.cho++;
      else if (v.includes("duyệt") || v.includes("xử lý")) s.daduyet++;
      else if (v.includes("hoàn") || v.includes("xong")) s.daxong++;
      else if (v.includes("hủy")) s.dahuy++;
    }

    return s;
  }, [rows]);

  // ===== Xem chi tiết phiếu =====
  const handleViewDetail = (row) => {
    const id = row.maPhieuDatHang ?? row.maphieudathang;
    if (!id) return;
    // Nếu route của bạn khác (vd: /chungtu/phieudathang/:id) thì chỉnh lại path này
    navigate(`/phieudathang/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý phiếu đặt hàng</h1>
          </div>
        </div>
        <button
          onClick={() => {
            setAddFormData({
              maNhaCungCap: "",
              maNhanVien: "",
              ngayHenDuKien: new Date().toISOString().split('T')[0],
              tienCoc: "",
              phuongThucThanhToan: "Tiền mặt",
              ghiChu: "",
            });
            setShowAddForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm phiếu đặt hàng
        </button>
      </div>

      {/* Stats */}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-yellow-500" /> Chờ xác nhận
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.cho}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-green-500" /> Đã duyệt
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.daduyet}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-purple-500" /> Hoàn thành
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.daxong}</div>
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Tất cả trạng thái</option>
            <option>Tạo mới</option>
            <option>Chờ xác nhận</option>
            <option>Đã duyệt</option>
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
          <div className="p-12 text-center text-gray-500">
            Chưa có phiếu đặt hàng nào
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Mã phiếu
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nhà cung cấp
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nhân viên phụ trách
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Ngày đặt
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Ngày hẹn dự kiến
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tổng tiền
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tiền cọc
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Còn lại
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  PT thanh toán
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Trạng thái phiếu
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedData.map((r) => (
                <tr key={r.maPhieuDatHang ?? r.maphieudathang} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {r.maPhieuDatHang ?? r.maphieudathang}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getTenNhaCungCap(r.manhacungcap ?? r.maNhaCungCap)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getTenNhanVien(r.manhanvien ?? r.maNhanVien)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {fmtDate(r.ngayDatPhieu ?? r.ngaydatphieu)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {fmtDate(r.ngayHenDuKien ?? r.ngayhendukien)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    {fmtCurrency(r.tongTien ?? r.tongtien)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {fmtCurrency(r.tienCoc ?? r.tiencoc)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {fmtCurrency(r.conLai ?? r.conlai)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.phuongThucThanhToan ?? r.phuongthucthanhtoan ?? ""}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      color={
                        (r.trangThaiPhieu ?? r.trangthaiphieu ?? "")
                          .toLowerCase()
                          .includes("hủy")
                          ? "bg-red-100 text-red-700"
                          : (r.trangThaiPhieu ?? r.trangthaiphieu ?? "")
                              .toLowerCase()
                              .includes("hoàn")
                          ? "bg-purple-100 text-purple-700"
                          : (r.trangThaiPhieu ?? r.trangthaiphieu ?? "")
                              .toLowerCase()
                              .includes("duyệt")
                          ? "bg-green-100 text-green-700"
                          : (r.trangThaiPhieu ?? r.trangthaiphieu ?? "")
                              .toLowerCase()
                              .includes("chờ")
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    >
                      {r.trangThaiPhieu ?? r.trangthaiphieu ?? ""}
                    </Badge>
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
              ))}
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

      {/* Modal form thêm phiếu đặt hàng */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Thêm phiếu đặt hàng mới
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
                  if (!addFormData.maNhaCungCap) {
                    alert("Vui lòng chọn nhà cung cấp!");
                    return;
                  }
                  if (!addFormData.maNhanVien) {
                    alert("Vui lòng chọn nhân viên!");
                    return;
                  }
                  if (!addFormData.ngayHenDuKien) {
                    alert("Vui lòng chọn ngày hẹn dự kiến!");
                    return;
                  }
                  if (!addFormData.phuongThucThanhToan) {
                    alert("Vui lòng chọn phương thức thanh toán!");
                    return;
                  }

                  // Log form data để kiểm tra
                  console.log('Form Data:', addFormData);

                  const payload = {
                     maNhaCungCap: Number(addFormData.maNhaCungCap),
                      maNhanVien: Number(addFormData.maNhanVien),
                      ngayDatPhieu: new Date().toISOString(),
                      ngayHenDuKien: addFormData.ngayHenDuKien,
                      tongTien: 0,
                      tienCoc: addFormData.tienCoc
                        ? Number(addFormData.tienCoc.replace(/[^0-9]/g, ''))
                        : 0,
                      conLai: 0,
                      phuongThucThanhToan: addFormData.phuongThucThanhToan,
                      // nếu bạn muốn trạng thái ban đầu là "Tạo mới"
                      trangThaiPhieu: "Tạo mới",
                      ghiChu: addFormData.ghiChu || null,
                  };

                  // Log payload để kiểm tra
                  console.log('Payload:', payload);

                  const res = await phieuDatHangService.create(payload);
                  
                  // Reload data
                  const newList = await phieuDatHangService.getAll();
                  setRows(Array.isArray(newList) ? newList : []);
                  
                  setShowAddForm(false);
                  alert("Thêm phiếu đặt hàng thành công!");

                  // Navigate to detail page if we have the new ID
                  if (res?.maPhieuDatHang || res?.maphieudathang) {
                    navigate(`/phieudathang/${res.maPhieuDatHang ?? res.maphieudathang}`);
                  }
                } catch (error) {
                  console.error("Lỗi khi thêm phiếu:", error);
                  alert(
                    "Có lỗi xảy ra khi thêm phiếu đặt hàng! " +
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
                    Nhà cung cấp <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addFormData.maNhaCungCap}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        maNhaCungCap: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Chọn nhà cung cấp --</option>
                    {Array.isArray(suppliers) && suppliers.map((s) => {
                      console.log('Rendering supplier option:', s);
                      return (
                        <option key={s.maNhaCungCap} value={s.maNhaCungCap}>
                          {s.tenNhaCungCap}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhân viên phụ trách <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addFormData.maNhanVien}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        maNhanVien: e.target.value,
                      })
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày hẹn dự kiến <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={addFormData.ngayHenDuKien}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      ngayHenDuKien: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiền cọc
                </label>
                <input
                  type="text"
                  value={addFormData.tienCoc}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      tienCoc: e.target.value,
                    })
                  }
                  placeholder="Nhập số tiền cọc"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phương thức thanh toán <span className="text-red-500">*</span>
                </label>
                <select
                  value={addFormData.phuongThucThanhToan}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      phuongThucThanhToan: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Chọn phương thức --</option>
                  <option value="Tiền mặt">Tiền mặt</option>
                  <option value="Chuyển khoản">Chuyển khoản</option>
                  <option value="Thẻ tín dụng">Thẻ tín dụng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={addFormData.ghiChu}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      ghiChu: e.target.value,
                    })
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
