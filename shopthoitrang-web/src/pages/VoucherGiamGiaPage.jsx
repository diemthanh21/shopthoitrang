import { useEffect, useMemo, useState } from "react";
import { Tag, Plus, Search, Edit, Trash2, X, Save } from "lucide-react";

import magiamgiaService from "../services/magiamgiaService";
import nhanvienService from "../services/nhanvienService";
import { useAuth } from "../contexts/AuthContext"; // chỉnh path nếu khác

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN") : "";

export default function MaGiamGiaPage() {
  const { user } = useAuth(); // user đang login

  // ===== Lấy mã & tên NV hiện tại từ user =====
  const currentMaNhanVien =
    user?.maNhanVien ??
    user?.manhanvien ??
    user?.nhanVien?.maNhanVien ??
    user?.nhanvien?.manhanvien ??
    "";

  const currentTenNhanVien =
    user?.hoTen ??
    user?.hoten ??
    user?.nhanVien?.hoTen ??
    user?.nhanvien?.hoten ??
    user?.fullName ??
    "";

  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    maCode: "",
    moTa: "",
    giaTriGiam: 0,
    soLuong: 0,
    ngayBatDau: "",
    ngayKetThuc: "",
    maNhanVien: "",
  });

  // ===== Helpers: id -> tên nhân viên =====
  const getTenNhanVien = (maNV) => {
    if (!maNV) return "";
    const found = employees.find(
      (e) =>
        e.maNhanVien === maNV ||
        e.manhanvien === maNV ||
        Number(e.maNhanVien ?? e.manhanvien) === Number(maNV)
    );
    return found?.hoTen ?? found?.hoten ?? `NV #${maNV}`;
  };

  // ===== Helper: trạng thái voucher theo ngày =====
  const getTrangThaiVoucher = (v) => {
    const today = new Date();
    const dToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();

    const startRaw = v.ngayBatDau ?? v.ngaybatdau;
    const endRaw = v.ngayKetThuc ?? v.ngayketthuc;

    if (!startRaw && !endRaw) {
      return { label: "Không xác định", color: "bg-gray-100 text-gray-700" };
    }

    const dStart = startRaw
      ? new Date(startRaw).setHours(0, 0, 0, 0)
      : null;
    const dEnd = endRaw ? new Date(endRaw).setHours(0, 0, 0, 0) : null;

    if (dStart && dToday < dStart) {
      return { label: "Sắp diễn ra", color: "bg-blue-100 text-blue-700" };
    }

    if (dEnd && dToday > dEnd) {
      return { label: "Đã kết thúc", color: "bg-red-100 text-red-700" };
    }

    // Nếu không rơi vào 2 case trên => đang diễn ra
    return { label: "Đang diễn ra", color: "bg-green-100 text-green-700" };
  };

  // ===== Load dữ liệu =====
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const [vouchers, emps] = await Promise.all([
          magiamgiaService.getAll(),
          nhanvienService.getAll(),
        ]);

        setItems(Array.isArray(vouchers) ? vouchers : []);
        setEmployees(Array.isArray(emps) ? emps : []);
      } catch (e) {
        console.error(e);
        setError("Không thể tải danh sách mã giảm giá / nhân viên");
        setItems([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ===== Tìm kiếm =====
  const term = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      items.filter((v) => {
        if (!term) return true;

        const tenNV = getTenNhanVien(v.maNhanVien);

        const { label: statusLabel } = getTrangThaiVoucher(v);

        const hay = [
          v.maVoucher,
          v.maCode,
          v.moTa,
          v.giaTriGiam,
          v.soLuong,
          v.maNhanVien,
          tenNV,
          statusLabel,
        ]
          .map((x) => String(x ?? "").toLowerCase())
          .join(" ");

        return hay.includes(term);
      }),
    [items, term, employees]
  );

  // ===== Mở form Thêm / Sửa =====
  const openAddForm = () => {
    setEditingItem(null);
    setFormData({
      maCode: "",
      moTa: "",
      giaTriGiam: 0,
      soLuong: 0,
      ngayBatDau: "",
      ngayKetThuc: "",
      maNhanVien: currentMaNhanVien || "",
    });
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setFormData({
      maCode: item.maCode ?? "",
      moTa: item.moTa ?? "",
      giaTriGiam: Number(item.giaTriGiam ?? 0),
      soLuong: Number(item.soLuong ?? 0),
      ngayBatDau: item.ngayBatDau
        ? item.ngayBatDau.toString().split("T")[0]
        : "",
      ngayKetThuc: item.ngayKetThuc
        ? item.ngayKetThuc.toString().split("T")[0]
        : "",
      maNhanVien:
        item.maNhanVien ??
        currentMaNhanVien ??
        "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // ===== Xoá =====
  const handleDelete = async (id) => {
    if (!window.confirm("Xoá mã giảm giá này?")) return;
    try {
      await magiamgiaService.delete(id);
      const newList = await magiamgiaService.getAll();
      setItems(Array.isArray(newList) ? newList : []);
    } catch (e) {
      console.error(e);
      alert("Không thể xoá mã giảm giá");
    }
  };

  // ===== Lưu (Thêm / Sửa) =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.maCode.trim()) {
      alert("Vui lòng nhập mã code!");
      return;
    }
    if (!formData.giaTriGiam || Number(formData.giaTriGiam) <= 0) {
      alert("Giá trị giảm phải lớn hơn 0!");
      return;
    }
    if (!formData.soLuong || Number(formData.soLuong) <= 0) {
      alert("Số lượng phải lớn hơn 0!");
      return;
    }

    const maNVForPayload =
      formData.maNhanVien ||
      currentMaNhanVien ||
      null;

    const payload = {
      maCode: formData.maCode.trim(),
      moTa: formData.moTa || null,
      giaTriGiam: Number(formData.giaTriGiam) || 0,
      soLuong: Number(formData.soLuong) || 0,
      ngayBatDau: formData.ngayBatDau || null,
      ngayKetThuc: formData.ngayKetThuc || null,
      maNhanVien: maNVForPayload ? Number(maNVForPayload) : null,
    };

    try {
      setSaving(true);
      if (editingItem) {
        await magiamgiaService.update(editingItem.maVoucher, payload);
        alert("Cập nhật mã giảm giá thành công!");
      } else {
        await magiamgiaService.create(payload);
        alert("Thêm mã giảm giá thành công!");
      }

      const newList = await magiamgiaService.getAll();
      setItems(Array.isArray(newList) ? newList : []);
      closeForm();
    } catch (error) {
      console.error("Lỗi khi lưu mã giảm giá:", error);
      alert(
        "Có lỗi xảy ra khi lưu mã giảm giá: " +
          (error.response?.data?.message || error.message || "")
      );
    } finally {
      setSaving(false);
    }
  };

  // ===== UI =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-700">Đang tải mã giảm giá…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý mã giảm giá
            </h1>
            <p className="text-gray-600">
              Tạo và quản lý các voucher khuyến mãi
            </p>
          </div>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Thêm mã giảm giá
        </button>
      </div>

      {/* Search */}
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
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã code, mô tả, nhân viên, trạng thái…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {term ? "Không tìm thấy mã giảm giá" : "Chưa có mã giảm giá nào"}
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã voucher
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mô tả
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giá trị giảm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Số lượng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ngày bắt đầu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ngày kết thúc
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nhân viên tạo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((v) => {
                const tenNV = getTenNhanVien(v.maNhanVien);
                const { label: statusLabel, color: statusColor } =
                  getTrangThaiVoucher(v);

                return (
                  <tr key={v.maVoucher} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {v.maVoucher}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {v.maCode}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {v.moTa || ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {v.giaTriGiam}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {v.soLuong}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {fmtDate(v.ngayBatDau ?? v.ngaybatdau)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {fmtDate(v.ngayKetThuc ?? v.ngayketthuc)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {tenNV}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <button
                        onClick={() => openEditForm(v)}
                        className="text-blue-600 hover:text-blue-800 mr-3 inline-flex items-center gap-1"
                      >
                        <Edit size={18} />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(v.maVoucher)}
                        className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                      >
                        <Trash2 size={18} />
                        Xoá
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Thêm / Sửa */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem
                  ? "Chỉnh sửa mã giảm giá"
                  : "Thêm mã giảm giá mới"}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã code <span className="text-red-500">*</span>
                </label>
                <input
                  value={formData.maCode}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, maCode: e.target.value }))
                  }
                  placeholder="VD: SALE50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, moTa: e.target.value }))
                  }
                  placeholder="VD: Giảm 50.000 cho đơn từ 500.000"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá trị giảm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.giaTriGiam}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        giaTriGiam: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.soLuong}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        soLuong: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.ngayBatDau}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        ngayBatDau: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.ngayKetThuc}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        ngayKetThuc: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Nhân viên tạo mã – hiển thị tên, lưu ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhân viên tạo mã
                </label>
                <input
                  type="text"
                  value={
                    currentTenNhanVien
                      ? currentTenNhanVien
                      : getTenNhanVien(formData.maNhanVien)
                  }
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                  placeholder="Không xác định"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
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