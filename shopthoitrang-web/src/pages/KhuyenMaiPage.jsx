// src/pages/KhuyenMaiPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Gift, Plus, Search, Edit, Trash2, X, Save, Percent } from "lucide-react";

import khuyenmaiService from "../services/khuyenmaiService";
import sanphamService from "../services/sanphamService";
import nhanvienService from "../services/nhanvienService";
import { useAuth } from "../contexts/AuthContext"; // chỉnh path nếu khác

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN") : "—";

export default function KhuyenMaiPage() {
  const { user } = useAuth();

  // ===== Thông tin nhân viên đang login =====
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
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    tenChuongTrinh: "",
    loaiKhuyenMai: "",
    maSanPham: "",
    tyLeGiam: 0,
    maSanPhamTang: "",
    ngayBatDau: "",
    ngayKetThuc: "",
    moTa: "",
    maNhanVien: "",
  });

  // ===== Helper: id -> tên sản phẩm =====
  const getTenSanPham = (maSP) => {
    if (!maSP) return "—";
    const found = products.find(
      (p) =>
        p.maSanPham === maSP ||
        p.masanpham === maSP ||
        Number(p.maSanPham ?? p.masanpham) === Number(maSP)
    );
    return found?.tenSanPham ?? found?.tensanpham ?? `SP #${maSP}`;
  };

  // ===== Helper: id -> tên nhân viên =====
  const getTenNhanVien = (maNV) => {
    if (!maNV) return "—";
    const found = employees.find(
      (e) =>
        e.maNhanVien === maNV ||
        e.manhanvien === maNV ||
        Number(e.maNhanVien ?? e.manhanvien) === Number(maNV)
    );
    return found?.hoTen ?? found?.hoten ?? `NV #${maNV}`;
  };

  // ===== Helper: trạng thái khuyến mãi =====
  const getTrangThaiKhuyenMai = (v) => {
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

    return { label: "Đang diễn ra", color: "bg-green-100 text-green-700" };
  };

  // ===== Load dữ liệu =====
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const [kmRes, spRes, nvRes] = await Promise.all([
          khuyenmaiService.getAll(),
          sanphamService.getAll(),
          nhanvienService.getAll(),
        ]);

        setItems(Array.isArray(kmRes) ? kmRes : kmRes?.data ?? []);
        setProducts(Array.isArray(spRes) ? spRes : spRes?.data ?? []);
        setEmployees(Array.isArray(nvRes) ? nvRes : nvRes?.data ?? []);
      } catch (e) {
        console.error(e);
        setError("Không thể tải danh sách khuyến mãi / sản phẩm / nhân viên");
        setItems([]);
        setProducts([]);
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

        const maKM = v.maKhuyenMai ?? v.makhuyenmai;
        const tenCT = v.tenChuongTrinh ?? v.tenchuongtrinh;
        const loai = v.loaiKhuyenMai ?? v.loaikhuyenmai;
        const tenSP = getTenSanPham(v.maSanPham ?? v.masanpham);
        const tenSPTang = getTenSanPham(v.maSanPhamTang ?? v.masanphamtang);
        const tenNV = getTenNhanVien(v.maNhanVien ?? v.manhanvien);

        const { label: statusLabel } = getTrangThaiKhuyenMai(v);

        const hay = [
          maKM,
          tenCT,
          loai,
          tenSP,
          tenSPTang,
          tenNV,
          statusLabel,
          v.moTa ?? v.mota,
        ]
          .map((x) => String(x ?? "").toLowerCase())
          .join(" ");

        return hay.includes(term);
      }),
    [items, term, products, employees]
  );

  // ===== Mở form Thêm / Sửa =====
  const openAddForm = () => {
    setEditingItem(null);
    setFormData({
      tenChuongTrinh: "",
      loaiKhuyenMai: "",
      maSanPham: "",
      tyLeGiam: 0,
      maSanPhamTang: "",
      ngayBatDau: "",
      ngayKetThuc: "",
      moTa: "",
      maNhanVien: currentMaNhanVien || "",
    });
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setFormData({
      tenChuongTrinh: item.tenChuongTrinh ?? item.tenchuongtrinh ?? "",
      loaiKhuyenMai: item.loaiKhuyenMai ?? item.loaikhuyenmai ?? "",
      maSanPham:
        item.maSanPham ?? item.masanpham
          ? String(item.maSanPham ?? item.masanpham)
          : "",
      tyLeGiam: Number(item.tyLeGiam ?? item.tylegiam ?? 0),
      maSanPhamTang:
        item.maSanPhamTang ?? item.masanphamtang
          ? String(item.maSanPhamTang ?? item.masanphamtang)
          : "",
      ngayBatDau: item.ngayBatDau
        ? item.ngayBatDau.toString().split("T")[0]
        : item.ngaybatdau
        ? item.ngaybatdau.toString().split("T")[0]
        : "",
      ngayKetThuc: item.ngayKetThuc
        ? item.ngayKetThuc.toString().split("T")[0]
        : item.ngayketthuc
        ? item.ngayketthuc.toString().split("T")[0]
        : "",
      moTa: item.moTa ?? item.mota ?? "",
      maNhanVien:
        item.maNhanVien ?? item.manhanvien ?? currentMaNhanVien ?? "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // ===== Xoá =====
  const handleDelete = async (id) => {
    if (!window.confirm("Xoá chương trình khuyến mãi này?")) return;
    try {
      await khuyenmaiService.delete(id);
      const newList = await khuyenmaiService.getAll();
      setItems(Array.isArray(newList) ? newList : newList?.data ?? []);
    } catch (e) {
      console.error(e);
      alert("Không thể xoá khuyến mãi");
    }
  };

  // ===== Lưu (Thêm / Sửa) =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tenChuongTrinh.trim()) {
      alert("Vui lòng nhập tên chương trình!");
      return;
    }
    if (!formData.loaiKhuyenMai.trim()) {
      alert("Vui lòng chọn loại khuyến mãi!");
      return;
    }
    if (Number(formData.tyLeGiam) < 0) {
      alert("Tỷ lệ giảm không được âm!");
      return;
    }

    const maNVForPayload =
      formData.maNhanVien || currentMaNhanVien || null;

    const payload = {
      tenChuongTrinh: formData.tenChuongTrinh.trim(),
      loaiKhuyenMai: formData.loaiKhuyenMai.trim(),
      maSanPham: formData.maSanPham
        ? Number(formData.maSanPham)
        : null,
      tyLeGiam: Number(formData.tyLeGiam) || 0,
      maSanPhamTang: formData.maSanPhamTang
        ? Number(formData.maSanPhamTang)
        : null,
      ngayBatDau: formData.ngayBatDau || null,
      ngayKetThuc: formData.ngayKetThuc || null,
      moTa: formData.moTa || null,
      maNhanVien: maNVForPayload ? Number(maNVForPayload) : null,
    };

    try {
      setSaving(true);

      if (editingItem) {
        const id = editingItem.maKhuyenMai ?? editingItem.makhuyenmai;
        await khuyenmaiService.update(id, payload);
        alert("Cập nhật khuyến mãi thành công!");
      } else {
        await khuyenmaiService.create(payload);
        alert("Thêm khuyến mãi thành công!");
      }

      const newList = await khuyenmaiService.getAll();
      setItems(Array.isArray(newList) ? newList : newList?.data ?? []);
      closeForm();
    } catch (error) {
      console.error("Lỗi khi lưu khuyến mãi:", error);
      alert(
        "Có lỗi xảy ra khi lưu khuyến mãi: " +
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
        <div className="text-lg text-gray-700">Đang tải khuyến mãi…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý khuyến mãi
            </h1>
            <p className="text-gray-600">
              Tạo và quản lý các chương trình khuyến mãi
            </p>
          </div>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Thêm khuyến mãi
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
              placeholder="Tìm kiếm theo tên CT, loại, sản phẩm, nhân viên, trạng thái…"
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
            {term ? "Không tìm thấy khuyến mãi" : "Chưa có chương trình khuyến mãi nào"}
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã KM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên chương trình
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Loại khuyến mãi
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sản phẩm áp dụng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tỷ lệ giảm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sản phẩm tặng
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
                const maKM = v.maKhuyenMai ?? v.makhuyenmai;
                const tenCT = v.tenChuongTrinh ?? v.tenchuongtrinh;
                const loai = v.loaiKhuyenMai ?? v.loaikhuyenmai;
                const tenSP = getTenSanPham(v.maSanPham ?? v.masanpham);
                const tenSPTang = getTenSanPham(v.maSanPhamTang ?? v.masanphamtang);
                const tenNV = getTenNhanVien(v.maNhanVien ?? v.manhanvien);
                const { label: statusLabel, color: statusColor } =
                  getTrangThaiKhuyenMai(v);

                return (
                  <tr key={maKM} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {maKM}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {tenCT}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {loai || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {tenSP}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <Percent size={14} />
                        {v.tyLeGiam ?? v.tylegiam ?? 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {tenSPTang}
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
                        onClick={() => handleDelete(maKM)}
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem
                  ? "Chỉnh sửa khuyến mãi"
                  : "Thêm chương trình khuyến mãi mới"}
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
                  Tên chương trình <span className="text-red-500">*</span>
                </label>
                <input
                  value={formData.tenChuongTrinh}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      tenChuongTrinh: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: Giảm 20% tất cả sản phẩm áo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại khuyến mãi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.loaiKhuyenMai}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        loaiKhuyenMai: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn loại khuyến mãi --</option>
                    <option value="Giảm theo phần trăm">Giảm theo phần trăm</option>
                    <option value="Mua hàng tặng sản phẩm">Mua hàng tặng sản phẩm</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tỷ lệ giảm (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.tyLeGiam}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        tyLeGiam: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sản phẩm áp dụng
                  </label>
                  <select
                    value={formData.maSanPham}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        maSanPham: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Tất cả sản phẩm / Không chọn --</option>
                    {products.map((p) => (
                      <option
                        key={p.maSanPham ?? p.masanpham}
                        value={p.maSanPham ?? p.masanpham}
                      >
                        {p.tenSanPham ?? p.tensanpham}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sản phẩm tặng (nếu có)
                  </label>
                  <select
                    value={formData.maSanPhamTang}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        maSanPhamTang: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Không tặng sản phẩm --</option>
                    {products.map((p) => (
                      <option
                        key={p.maSanPham ?? p.masanpham}
                        value={p.maSanPham ?? p.masanpham}
                      >
                        {p.tenSanPham ?? p.tensanpham}
                      </option>
                    ))}
                  </select>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, moTa: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ghi chú thêm về chương trình khuyến mãi"
                />
              </div>

              {/* Nhân viên tạo – hiển thị tên, lưu ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhân viên tạo
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
