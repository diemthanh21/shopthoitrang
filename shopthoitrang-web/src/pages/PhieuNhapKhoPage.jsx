// src/pages/PhieuNhapKhoPage.jsx
import { useEffect, useMemo, useState } from "react";
import { FileText, Search, Eye, Plus, X, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

import phieuNhapKhoService from "../services/phieunhapkhoService";
import nhanvienService from "../services/nhanvienService";
import nhacungcapService from "../services/nhacungcapService";

// Format helpers
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN") : "—";

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

export default function PhieuNhapKhoPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addFormData, setAddFormData] = useState({
    maNhaCungCap: "",
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

        const [p, emps, nccs] = await Promise.all([
          phieuNhapKhoService.getAll(),   // đã normalize → dùng camelCase
          nhanvienService.getAll(),
          nhacungcapService.getAll(),
        ]);

        setRows(Array.isArray(p) ? p : p?.data ?? []);
        setEmployees(Array.isArray(emps) ? emps : emps?.data ?? []);
        setSuppliers(Array.isArray(nccs) ? nccs : nccs?.data ?? []);
      } catch (e) {
        console.error(e);
        setRows([]);
        setEmployees([]);
        setSuppliers([]);
        setErr("Không thể tải danh sách phiếu nhập kho / nhân viên / nhà cung cấp");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ===== Helper: id -> tên nhân viên =====
  function getTenNhanVien(maNhanVien) {
    if (!maNhanVien) return "—";
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
    if (!maNCC) return "—";
    const found = suppliers.find(
      (s) =>
        s.maNhaCungCap === maNCC ||
        s.manhacungcap === maNCC ||
        Number(s.maNhaCungCap ?? s.manhacungcap) === Number(maNCC)
    );
    return found?.tenNhaCungCap ?? found?.tennhacungcap ?? `#${maNCC}`;
  }

  // ===== Filter client-side =====
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();

    return rows.filter((r) => {
      if (!term) return true;

      const hay = [
        r.maPhieuNhap,                     // đã normalize
        getTenNhaCungCap(r.maNhaCungCap),
        getTenNhanVien(r.maNhanVien),
        r.ghiChu,
        r.trangThai,                       // search theo trạng thái
      ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();

      return hay.includes(term);
    });
  }, [rows, q, employees, suppliers]);

  // ===== Thống kê theo trạng thái (giống phiếu đặt hàng) =====
  const stats = useMemo(() => {
    const s = { taoMoi: 0, choxacnhan : 0, hoanTat: 0, daHuy: 0 };

    for (const r of rows) {
      const v = (r.trangThai || "").toLowerCase();

      if (v.includes("tạo")) s.taoMoi++;
      else if (v.includes("nhập") || v.includes("đang")) s.choxacnhan++;
      else if (v.includes("hoàn") || v.includes("tất") || v.includes("xong"))
        s.hoanTat++;
      else if (v.includes("hủy")) s.daHuy++;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý phiếu nhập kho</h1>
            <p className="text-gray-600">Theo dõi các phiếu nhập hàng từ nhà cung cấp</p>
          </div>
        </div>
        <button
          onClick={() => {
            setAddFormData({
              maNhaCungCap: "",
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

      {/* Stats (giống phiếu đặt hàng) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-gray-500" /> Tạo mới
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.taoMoi}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-blue-500" /> Chờ xác nhận
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.choxacnhan}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-green-500" /> Hoàn tất
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.hoanTat}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center">
            <StatusDot color="bg-red-500" /> Đã hủy
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.daHuy}</div>
        </div>
      </div>

      {/* Search */}
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
              placeholder="Tìm kiếm (mã phiếu, nhà cung cấp, nhân viên, ghi chú, trạng thái...)"
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Chưa có phiếu nhập kho nào
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
              {list.map((r) => {
                const status = r.trangThai || "Tạo mới"; // lấy đúng từ normalize
                const sLower = status.toLowerCase();
                const badgeColor = sLower.includes("hủy")
                  ? "bg-red-100 text-red-700"
                  : sLower.includes("hoàn") || sLower.includes("tất") || sLower.includes("xong")
                  ? "bg-green-100 text-green-700"
                  : sLower.includes("chờ") || sLower.includes("xác")
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700";

                return (
                  <tr key={r.maPhieuNhap} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {r.maPhieuNhap}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getTenNhaCungCap(r.maNhaCungCap)}
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
                      {r.ghiChu ?? "—"}
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
                  if (!addFormData.maNhaCungCap) {
                    alert("Vui lòng chọn nhà cung cấp!");
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

                  // Gửi camelCase, service sẽ toDB + set trangthai = "Tạo mới"
                  const payload = {
                    maNhanVien: Number(addFormData.maNhanVien),
                    maNhaCungCap: Number(addFormData.maNhaCungCap),
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

                  // Navigate to detail page nếu có ID mới
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
                    Nhà cung cấp <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addFormData.maNhaCungCap}
                    onChange={(e) =>
                      setAddFormData((old) => ({
                        ...old,
                        maNhaCungCap: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Chọn nhà cung cấp --</option>
                    {Array.isArray(suppliers) &&
                      suppliers.map((s) => (
                        <option
                          key={s.maNhaCungCap ?? s.manhacungcap}
                          value={s.maNhaCungCap ?? s.manhacungcap}
                        >
                          {s.tenNhaCungCap ?? s.tennhacungcap}
                        </option>
                      ))}
                  </select>
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
