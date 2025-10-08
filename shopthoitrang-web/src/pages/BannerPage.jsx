import { useEffect, useState } from "react";
import { Image as ImageIcon, Plus, Search, Edit, Trash2 } from "lucide-react";
import bannerService from "../services/bannerService";

export default function BannerPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await bannerService.getAll();
      setItems(data);
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

  const term = search.trim().toLowerCase();
  const filtered = items.filter((b) => {
    if (!term) return true;
    const haystacks = [
      String(b.maBanner ?? ""),
      b.duongDanAnh ?? "",
      b.moTa ?? "",
      b.lienKet ?? "",
      String(b.thuTuHienThi ?? ""),
      String(b.dangHoatDong ?? "")
    ].map((x) => String(x).toLowerCase());
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
          <ImageIcon className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý banner</h1>
            <p className="text-gray-600">Danh sách banner hiển thị trên hệ thống</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ảnh</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên kết</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thứ tự</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đang hoạt động</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((b) => (
                <tr key={b.maBanner} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.maBanner}</td>
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
                  <td className="px-4 py-3 text-sm text-gray-900">{b.moTa ?? "N/A"}</td>
                  <td className="px-4 py-3 text-sm">
                    {b.lienKet ? (
                      <a className="text-blue-600 hover:underline" href={b.lienKet} target="_blank" rel="noreferrer">
                        {b.lienKet}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{b.thuTuHienThi ?? "N/A"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        b.dangHoatDong ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {b.dangHoatDong ? "Đang bật" : "Đang tắt"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(b.maBanner)} className="text-red-600 hover:text-red-800">
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
