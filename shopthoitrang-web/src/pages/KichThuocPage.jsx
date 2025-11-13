import { useEffect, useMemo, useState } from "react";
import { Ruler, Plus, Search, Edit3 } from "lucide-react";
import { message } from "antd";
import kichthuocService from "../services/kichthuocService";

const PAGE_SIZE = 10;

export default function KichThuocPage() {
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState(null);
  const [formData, setFormData] = useState({ tenKichThuoc: "", moTa: "" });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchSizes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

const fetchSizes = async () => {
  try {
    setLoading(true);
      const data = await kichthuocService.getAll();
      setSizes(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách kích thước.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSizes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sizes;
    return sizes.filter((size) => {
      const haystack = [
        size.maKichThuoc,
        size.tenKichThuoc,
        size.moTa,
      ]
        .filter(Boolean)
        .map((v) => v.toString().toLowerCase());
      return haystack.some((value) => value.includes(term));
    });
  }, [sizes, searchTerm]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredSizes.length / PAGE_SIZE) || 1
    );
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [filteredSizes]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSizes.length / PAGE_SIZE) || 1
  );
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedSizes = filteredSizes.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const openModal = (size = null) => {
    if (size) {
      setEditingSize(size);
      setFormData({
        tenKichThuoc: size.tenKichThuoc ?? "",
        moTa: size.moTa ?? "",
      });
    } else {
      setEditingSize(null);
      setFormData({ tenKichThuoc: "", moTa: "" });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSize(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      tenKichThuoc: formData.tenKichThuoc.trim(),
      moTa: formData.moTa.trim(),
    };

    if (!payload.tenKichThuoc) {
      message.warning("Vui lòng nhập tên kích thước.");
      return;
    }

    try {
      if (editingSize) {
        await kichthuocService.update(editingSize.maKichThuoc, payload);
        message.success("Đã cập nhật kích thước.");
      } else {
        await kichthuocService.create(payload);
        message.success("Đã thêm kích thước mới.");
      }
      closeModal();
      fetchSizes();
    } catch (err) {
      console.error(err);
      message.error(
        err.response?.data?.message || "Không thể lưu kích thước. Thử lại."
      );
    }
  };

  const renderPagination = () => (
    <div className="flex items-center justify-between pt-4">
      <span className="text-sm text-gray-600">
        Trang {currentPage}/{totalPages} · Tổng {filteredSizes.length} kích
        thước
      </span>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 rounded-lg border text-sm hover:bg-blue-50 disabled:opacity-40"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        >
          Trước
        </button>
        <button
          className="px-3 py-1 rounded-lg border text-sm hover:bg-blue-50 disabled:opacity-40"
          disabled={currentPage === totalPages}
          onClick={() =>
            setCurrentPage((p) => Math.min(totalPages, p + 1))
          }
        >
          Sau
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-600 text-lg">Đang tải kích thước...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Ruler size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý kích thước
            </h1>
            <p className="text-gray-500">
              Danh sách các size chuẩn dùng cho sản phẩm.
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal(null)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Thêm kích thước
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {paginatedSizes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? "Không tìm thấy kích thước phù hợp" : "Chưa có kích thước nào"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-blue-50 text-blue-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Mã kích thước
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Tên kích thước
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Mô tả
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedSizes.map((size, idx) => (
                  <tr
                    key={size.maKichThuoc ?? idx}
                    className="hover:bg-blue-50/40"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {startIndex + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {size.maKichThuoc}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {size.tenKichThuoc || ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {size.moTa || ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(size)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <Edit3 size={16} />
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredSizes.length > 0 && (
          <div className="px-6 pb-6">{renderPagination()}</div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingSize ? "Cập nhật kích thước" : "Thêm kích thước mới"}
                </h3>
                <p className="text-sm text-gray-500">
                  Vui lòng nhập đầy đủ thông tin bên dưới.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Tên kích thước <span className="text-red-500">*</span>
                </label>
                <input
                  value={formData.tenKichThuoc}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tenKichThuoc: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: XS, S, M, L..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Mô tả
                </label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, moTa: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Thông tin mô tả thêm..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSize ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
