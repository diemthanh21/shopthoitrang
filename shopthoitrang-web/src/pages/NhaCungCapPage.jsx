// src/pages/NhaCungCapPage.jsx
import { useEffect, useMemo, useState } from "react";
import { FileText, Search, Plus, Edit2, Trash2, X, Save } from "lucide-react";

import nhacungcapService from "../services/nhacungcapService";

export default function NhaCungCapPage() {
  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    tenNhaCungCap: "",
    email: "",
    diaChi: "",
    soDienThoai: "",
  });

  // ===== Load danh sách nhà cung cấp =====
  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await nhacungcapService.getAll();
      // có thể trả về {data:[...]} hoặc mảng
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setRows(list);
    } catch (e) {
      console.error("Lỗi load nhà cung cấp:", e);
      setErr("Không thể tải danh sách nhà cung cấp");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== Chuẩn hoá field =====
  const normalizeRow = (r) => ({
    maNhaCungCap: r.maNhaCungCap ?? r.manhacungcap,
    tenNhaCungCap: r.tenNhaCungCap ?? r.tennhacungcap,
    email: r.email ?? "",
    diaChi: r.diaChi ?? r.diachi ?? "",
    soDienThoai: r.soDienThoai ?? r.sodienthoai ?? "",
  });

  // ===== Filter client-side =====
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .map(normalizeRow)
      .filter((r) => {
        if (!term) return true;
        const hay = [
          r.maNhaCungCap,
          r.tenNhaCungCap,
          r.email,
          r.diaChi,
          r.soDienThoai,
        ]
          .map((x) => String(x ?? ""))
          .join(" ")
          .toLowerCase();
        return hay.includes(term);
      });
  }, [rows, q]);

  // ===== Open / close form =====
  const openAddForm = () => {
    setEditingItem(null);
    setFormData({
      tenNhaCungCap: "",
      email: "",
      diaChi: "",
      soDienThoai: "",
    });
    setShowForm(true);
  };

  const openEditForm = (rowRaw) => {
    const row = normalizeRow(rowRaw);
    setEditingItem(row);
    setFormData({
      tenNhaCungCap: row.tenNhaCungCap || "",
      email: row.email || "",
      diaChi: row.diaChi || "",
      soDienThoai: row.soDienThoai || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      tenNhaCungCap: "",
      email: "",
      diaChi: "",
      soDienThoai: "",
    });
  };

  // ===== Save (create / update) =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tenNhaCungCap.trim()) {
      alert("Vui lòng nhập tên nhà cung cấp!");
      return;
    }

    const payload = {
      tennhacungcap: formData.tenNhaCungCap.trim(),
      email: formData.email?.trim() || null,
      diachi: formData.diaChi?.trim() || null,
      sodienthoai: formData.soDienThoai?.trim() || null,
    };

    setSaving(true);
    try {
      if (editingItem) {
        const id = editingItem.maNhaCungCap;
        await nhacungcapService.update(id, payload);
        alert("Cập nhật nhà cung cấp thành công!");
      } else {
        await nhacungcapService.create(payload);
        alert("Thêm nhà cung cấp thành công!");
      }
      await loadData();
      closeForm();
    } catch (error) {
      console.error("Lỗi lưu nhà cung cấp:", error);
      alert(
        "Có lỗi xảy ra khi lưu nhà cung cấp! " +
          (error.response?.data?.message || error.message || "")
      );
    } finally {
      setSaving(false);
    }
  };

  // ===== Delete =====
  const handleDelete = async (rowRaw) => {
    const row = normalizeRow(rowRaw);
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xoá nhà cung cấp "${row.tenNhaCungCap}"?`
      )
    )
      return;

    try {
      await nhacungcapService.delete(row.maNhaCungCap);
      await loadData();
      alert("Đã xoá nhà cung cấp");
    } catch (error) {
      console.error("Lỗi xoá nhà cung cấp:", error);
      alert(
        "Có lỗi xảy ra khi xoá nhà cung cấp! " +
          (error.response?.data?.message || error.message || "")
      );
    }
  };

  // ===== UI =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý nhà cung cấp
            </h1>
            <p className="text-gray-600">
              Thêm, sửa, xoá và theo dõi thông tin nhà cung cấp
            </p>
          </div>
        </div>
        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm nhà cung cấp
        </button>
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
              placeholder="Tìm kiếm theo tên, email, số điện thoại, địa chỉ..."
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
            Chưa có nhà cung cấp nào
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Mã NCC
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tên nhà cung cấp
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Số điện thoại
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Địa chỉ
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((rRaw) => {
                const r = normalizeRow(rRaw);
                return (
                  <tr
                    key={r.maNhaCungCap}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {r.maNhaCungCap}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {r.tenNhaCungCap}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {r.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {r.soDienThoai || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                      {r.diaChi || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditForm(rRaw)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(rRaw)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Xoá"
                        >
                          <Trash2 size={16} />
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

      {/* Modal form thêm / sửa */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
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
                  Tên nhà cung cấp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tenNhaCungCap}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      tenNhaCungCap: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.soDienThoai}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, soDienThoai: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <textarea
                  value={formData.diaChi}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, diaChi: e.target.value }))
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
