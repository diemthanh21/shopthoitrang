// src/pages/CaLamViecPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Clock, Plus, Search, X, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import calamviecService from "../services/calamviecService";
import { useAuth } from "../contexts/AuthContext";

function formatTime(v) {
  if (!v) return "N/A";
  const s = v.toString();
  // Nếu là HH:MM:SS thì cắt còn HH:MM
  if (s.length >= 5) return s.slice(0, 5);
  return s;
}

export default function CaLamViecPage() {
  const { user } = useAuth();
  // ADMIN + MANAGER được sửa
  const canEdit = ["ADMIN", "MANAGER"].includes(user?.maQuyen);

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null); // null = tạo mới

  const [form, setForm] = useState({
    tenCa: "",
    gioBatDau: "",
    gioKetThuc: "",
    moTa: "",
  });

  // ===== Load data =====
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await calamviecService.getAll();
        setShifts(list || []);
        setError("");
      } catch (e) {
        console.error(e);
        setError("Không thể tải danh sách ca làm việc.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ===== Helper functions =====
  // Kiểm tra ca làm việc có trùng giờ không
  const checkTimeConflict = (startTime, endTime, excludeId = null) => {
    const newStart = startTime.split(':').map(Number);
    const newEnd = endTime.split(':').map(Number);
    
    // Chuyển đổi thành phút để so sánh dễ hơn
    const newStartMinutes = newStart[0] * 60 + newStart[1];
    const newEndMinutes = newEnd[0] * 60 + newEnd[1];
    
    return shifts.some(shift => {
      if (excludeId && shift.maCa === excludeId) return false;
      
      const existingStart = shift.gioBatDau.split(':').map(Number);
      const existingEnd = shift.gioKetThuc.split(':').map(Number);
      const existingStartMinutes = existingStart[0] * 60 + existingStart[1];
      const existingEndMinutes = existingEnd[0] * 60 + existingEnd[1];
      
      // Kiểm tra trùng lặp: ca mới bắt đầu trước khi ca cũ kết thúc VÀ ca mới kết thúc sau khi ca cũ bắt đầu
      return (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes);
    });
  };

  // ===== Search =====
  const term = searchTerm.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!term) return shifts;
    return shifts.filter((c) => {
      const cells = [
        String(c.maCa ?? ""),
        c.tenCa ?? "",
        c.gioBatDau ?? "",
        c.gioKetThuc ?? "",
        c.moTa ?? "",
      ].map((x) => (x ?? "").toString().toLowerCase());
      return cells.some((v) => v.includes(term));
    });
  }, [shifts, term]);

  // ===== Pagination =====
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Reset về trang 1 khi search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ===== Mở form tạo mới =====
  function openCreate() {
    if (!canEdit) return;
    setEditingShift(null);
    setForm({
      tenCa: "",
      gioBatDau: "",
      gioKetThuc: "",
      moTa: "",
    });
    setShowForm(true);
  }

  // ===== Mở form chỉnh sửa =====
  function openEdit(shift) {
    if (!canEdit) return;
    setEditingShift(shift);
    setForm({
      tenCa: shift.tenCa || "",
      gioBatDau: shift.gioBatDau || "",
      gioKetThuc: shift.gioKetThuc || "",
      moTa: shift.moTa || "",
    });
    setShowForm(true);
  }

  // ===== Xoá =====
  async function handleDelete(id) {
    if (!canEdit) {
      alert("Bạn không có quyền xoá ca làm việc.");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa ca làm việc này?")) return;
    
    try {
      console.log("Đang xóa ca làm việc ID:", id);
      const result = await calamviecService.delete(id);
      console.log("Xóa thành công:", result);
      
      setShifts((prev) => prev.filter((x) => x.maCa !== id));
      alert("Xóa ca làm việc thành công.");
    } catch (e) {
      console.error("Lỗi khi xóa ca làm việc:", e);
      
      let errorMsg = "Không thể xóa ca làm việc.";
      if (e?.response?.data?.message) {
        errorMsg = e.response.data.message;
      } else if (e?.message) {
        errorMsg = e.message;
      }
      
      alert(`Lỗi: ${errorMsg}`);
    }
  }

    // ===== Submit form (tạo mới / cập nhật) =====
  async function handleSubmit(e) {
    e.preventDefault();

    if (!canEdit) {
      alert("Bạn không có quyền chỉnh sửa ca làm việc.");
      return;
    }

    if (!form.tenCa.trim()) {
      alert("Vui lòng nhập tên ca.");
      return;
    }

    if (!form.gioBatDau) {
      alert("Vui lòng chọn giờ bắt đầu.");
      return;
    }

    if (!form.gioKetThuc) {
      alert("Vui lòng chọn giờ kết thúc.");
      return;
    }

    // Kiểm tra giờ bắt đầu phải nhỏ hơn giờ kết thúc
    const startTime = form.gioBatDau.split(':').map(Number);
    const endTime = form.gioKetThuc.split(':').map(Number);
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];
    
    if (startMinutes >= endMinutes) {
      alert("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
      return;
    }

    // Kiểm tra trùng giờ với ca khác
    const excludeId = editingShift ? editingShift.maCa : null;
    if (checkTimeConflict(form.gioBatDau, form.gioKetThuc, excludeId)) {
      alert("Ca làm việc này bị trùng giờ với ca làm việc khác. Vui lòng chọn thời gian khác.");
      return;
    }

    try {
      if (editingShift) {
        const updated = await calamviecService.update(editingShift.maCa, {
          tenCa: form.tenCa.trim(),
          gioBatDau: form.gioBatDau,
          gioKetThuc: form.gioKetThuc,
          moTa: form.moTa || null,
        });

        setShifts((prev) =>
          prev.map((s) => (s.maCa === editingShift.maCa ? updated : s))
        );

        // ✅ THÔNG BÁO THÀNH CÔNG
        alert("Cập nhật ca làm việc thành công.");
      } else {
        const created = await calamviecService.create({
          tenCa: form.tenCa.trim(),
          gioBatDau: form.gioBatDau,
          gioKetThuc: form.gioKetThuc,
          moTa: form.moTa || null,
        });

        setShifts((prev) => [created, ...prev]);

        // ✅ THÔNG BÁO THÀNH CÔNG
        alert("Thêm ca làm việc mới thành công.");
      }

      setShowForm(false);
      setEditingShift(null);
    } catch (e) {
      console.error(e);
      alert(
        e?.response?.data?.message ||
          e?.message ||
          "Không thể lưu ca làm việc."
      );
    }
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg">Đang tải…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý ca làm việc
            </h1>
            <p className="text-gray-600">
              Thiết lập và quản lý danh sách ca làm việc cho nhân viên
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Thêm ca làm việc
          </button>
        )}
      </div>

      {/* Search + Error */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên ca, giờ bắt đầu, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-600">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} trong tổng số {filtered.length} ca làm việc
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {term ? "Không tìm thấy ca làm việc" : "Chưa có ca làm việc nào"}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Mã ca
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Tên ca
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Giờ bắt đầu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Giờ kết thúc
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Mô tả
                    </th>
                    {canEdit && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Thao tác
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((c) => (
                <tr key={c.maCa} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {c.maCa}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {c.tenCa || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatTime(c.gioBatDau)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatTime(c.gioKetThuc)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                    <span className="line-clamp-2">
                      {c.moTa || <span className="text-gray-400">Không có</span>}
                    </span>
                  </td>

                  {canEdit && (
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => openEdit(c)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={16} />
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(c.maCa)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                          title="Xoá"
                        >
                          <Trash2 size={16} />
                          Xoá
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
                </tbody>
              </table>
            </div>
            
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
          </>
        )}
      </div>

      {/* Modal Thêm / Sửa */}
      {showForm && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingShift(null);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {editingShift ? "Chỉnh sửa ca làm việc" : "Thêm ca làm việc mới"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tên ca */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên ca *
                </label>
                <input
                  value={form.tenCa}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, tenCa: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ca sáng, Ca chiều..."
                  required
                />
              </div>

              {/* Giờ bắt đầu + Giờ kết thúc */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giờ bắt đầu *
                  </label>
                  <input
                    type="time"
                    value={form.gioBatDau}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        gioBatDau: e.target.value,
                      }))
                    }
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giờ kết thúc *
                  </label>
                  <input
                    type="time"
                    value={form.gioKetThuc}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        gioKetThuc: e.target.value,
                      }))
                    }
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mô tả
                </label>
                <textarea
                  value={form.moTa}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, moTa: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Ví dụ: Ca sáng từ 8h-12h, dành cho nhân viên bán hàng..."
                />
              </div>

              {/* Action */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingShift(null);
                  }}
                  className="px-4 py-2 rounded-lg border"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                >
                  {editingShift ? "Lưu thay đổi" : "Lưu ca làm việc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
