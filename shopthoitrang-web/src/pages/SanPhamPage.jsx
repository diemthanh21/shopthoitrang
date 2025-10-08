import { useEffect, useState } from "react";
import { Boxes, Plus, Search, Edit, Trash2 } from "lucide-react";
import sanphamService from "../services/sanphamService";

export default function SanPhamPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await sanphamService.getAll();
      setItems(data);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Xoá sản phẩm này?")) return;
    try {
      await sanphamService.delete(id);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Không thể xoá sản phẩm");
    }
  }

  const term = searchTerm.trim().toLowerCase();
  const filtered = items.filter((sp) => {
    if (!term) return true;
    const haystacks = [
      String(sp.maSanPham ?? ""),
      sp.tenSanPham ?? "",
      String(sp.maDanhMuc ?? ""),
      String(sp.maThuongHieu ?? ""),
      String(sp.trangThai ?? "")
    ].map((x) => x.toString().toLowerCase());
    return haystacks.some((x) => x.includes(term));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Boxes className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
            <p className="text-gray-600">Danh sách sản phẩm trong hệ thống</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          Thêm sản phẩm
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mọi cột…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {term ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm nào"}
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã SP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã danh mục</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã thương hiệu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((sp) => (
                <tr key={sp.maSanPham} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{sp.maSanPham}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{sp.tenSanPham}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{sp.maDanhMuc ?? "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{sp.maThuongHieu ?? "N/A"}</td>
                  <td className="px-4 py-3 text-sm">
                    {/* hiển thị đúng giá trị model trả về */}
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {sp.trangThai ?? "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(sp.maSanPham)}
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
    </div>
  );
}
