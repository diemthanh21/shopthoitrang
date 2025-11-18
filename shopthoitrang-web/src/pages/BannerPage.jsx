// src/pages/BannerPage.jsx
import { useEffect, useState, useMemo } from "react";
import {
  Image as ImageIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
} from "lucide-react";
import bannerService from "../services/bannerService";
import { supabase } from "../utils/supabaseClient";

const SUPABASE_BUCKET =
  import.meta.env.VITE_SUPABASE_BUCKET || "banner";

export default function BannerPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    duongDanAnh: "",
    moTa: "",
    thuTuHienThi: "",
    dangHoatDong: true,
  });
  const [file, setFile] = useState(null); // File ảnh mới (nếu có)
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await bannerService.getAll();
      setItems(Array.isArray(data) ? data : []);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Không thể tải danh sách banner");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Xoá banner này?")) return;
    try {
      await bannerService.delete(id);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Không thể xoá banner");
    }
  }

  // ===== Upload ảnh lên Supabase bucket "banner" =====
  const uploadBannerImage = async (file) => {
    if (!supabase || !SUPABASE_BUCKET) {
      throw new Error(
        "Supabase chưa được cấu hình đúng (URL / KEY / BUCKET)."
      );
    }

    const ext = file.name.split(".").pop();
    const fileName = `banner-${Date.now()}.${ext || "jpg"}`;

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fileName, file);

    if (error) {
      console.error("Lỗi upload banner:", error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(data.path);

    const publicUrl = publicUrlData?.publicUrl || "";
    return publicUrl;
  };

  // ===== Mở / đóng form =====
  const handleOpenForm = (item = null) => {
    if (item) {
      // edit
      setEditingItem(item);
      setFormData({
        duongDanAnh: item.duongDanAnh ?? "",
        moTa: item.moTa ?? "",
        thuTuHienThi:
          item.thuTuHienThi !== null && item.thuTuHienThi !== undefined
            ? String(item.thuTuHienThi)
            : "",
        dangHoatDong: !!item.dangHoatDong,
      });
    } else {
      // create
      setEditingItem(null);
      setFormData({
        duongDanAnh: "",
        moTa: "",
        thuTuHienThi: "",
        dangHoatDong: true,
      });
    }
    setFile(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFile(null);
    setFormData({
      duongDanAnh: "",
      moTa: "",
      thuTuHienThi: "",
      dangHoatDong: true,
    });
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  // ===== Lưu create / update =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Validate cơ bản
      if (!editingItem && !file) {
        alert("Vui lòng chọn ảnh banner!");
        return;
      }

      let imageUrl = formData.duongDanAnh || "";

      // Nếu chọn file mới -> upload Supabase
      if (file) {
        imageUrl = await uploadBannerImage(file);
      }

      const payload = {
        duongDanAnh: imageUrl,
        moTa: formData.moTa?.trim() || null,
        thuTuHienThi:
          formData.thuTuHienThi !== ""
            ? Number(formData.thuTuHienThi)
            : null,
        dangHoatDong: !!formData.dangHoatDong,
      };

      if (editingItem) {
        await bannerService.update(editingItem.maBanner, payload);
        alert("Cập nhật banner thành công!");
      } else {
        await bannerService.create(payload);
        alert("Thêm banner thành công!");
      }

      await fetchData();
      handleCloseForm();
    } catch (error) {
      console.error("Lỗi khi lưu banner:", error);
      alert(
        "Có lỗi xảy ra khi lưu banner: " +
          (error.response?.data?.message || error.message || "")
      );
    } finally {
      setSaving(false);
    }
  };

  // ===== Filter search =====
  const term = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    const list = items ?? [];
    if (!term) return list;
    return list.filter((b) => {
      const haystacks = [
        String(b.maBanner ?? ""),
        b.duongDanAnh ?? "",
        b.moTa ?? "",
        String(b.thuTuHienThi ?? ""),
        String(b.dangHoatDong ?? ""),
      ].map((x) => String(x).toLowerCase());
      return haystacks.some((x) => x.includes(term));
    });
  }, [items, term]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  // Preview ảnh trong form: ưu tiên file mới, nếu không có thì dùng URL cũ
  const previewUrl = file
    ? URL.createObjectURL(file)
    : formData.duongDanAnh || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImageIcon className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý banner</h1>
            <p className="text-gray-600">
              Danh sách banner hiển thị trên hệ thống
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Thêm banner
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
              placeholder="Tìm kiếm theo mọi cột…"
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
            {term ? "Không tìm thấy banner" : "Chưa có banner nào"}
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ảnh
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mô tả
                </th>
                {/* Cột Liên kết đã được loại bỏ */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thứ tự
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Đang hoạt động
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((b) => (
                <tr key={b.maBanner} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {b.maBanner}
                  </td>
                  <td className="px-4 py-3">
                    {b.duongDanAnh ? (
                      <img
                        src={b.duongDanAnh}
                        alt={b.moTa ?? "banner"}
                        className="h-12 w-24 object-cover rounded border"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {b.moTa ?? "N/A"}
                  </td>
                  {/* Cột Liên kết đã được loại bỏ */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {b.thuTuHienThi ?? "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        b.dangHoatDong
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {b.dangHoatDong ? "Đang bật" : "Đang tắt"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      onClick={() => handleOpenForm(b)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.maBanner)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal thêm / sửa banner */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? "Chỉnh sửa banner" : "Thêm banner mới"}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Ảnh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh banner {editingItem ? "" : <span className="text-red-500">*</span>}
                </label>

                {previewUrl && (
                  <div className="mb-3">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-32 w-full object-cover rounded border"
                    />
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, moTa: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Thứ tự hiển thị */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.thuTuHienThi}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      thuTuHienThi: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.dangHoatDong ? "true" : "false"}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      dangHoatDong: e.target.value === "true",
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="true">Đang bật</option>
                  <option value="false">Đang tắt</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
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
