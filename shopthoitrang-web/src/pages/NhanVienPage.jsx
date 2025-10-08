import { useState, useEffect } from "react";
import { Users, Plus, Search, Edit, Trash2 } from "lucide-react";
import nhanvienService from "../services/nhanvienService";

function formatDate(v) {
  if (!v) return "N/A";
  try {
    // nhận ISO hoặc 'YYYY-MM-DD hh:mm:ss'
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    // dd/MM/yyyy
    return d.toLocaleDateString("vi-VN");
  } catch {
    return String(v);
  }
}

export default function NhanVienPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchEmployees(); }, []);

  async function fetchEmployees() {
    try {
      setLoading(true);
      const data = await nhanvienService.getAll();
      setEmployees(data); // data đã gồm đủ 8 thuộc tính
      setError("");
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;
    try {
      await nhanvienService.delete(id);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert("Không thể xóa nhân viên");
    }
  }

  const term = searchTerm.trim().toLowerCase();
  const filtered = employees.filter((emp) => {
    if (!term) return true;
    const haystacks = [
      String(emp.maNhanVien ?? ""),
      emp.hoTen ?? "",
      emp.email ?? "",
      emp.soDienThoai ?? "",
      emp.ngaySinh ?? "",
      emp.diaChi ?? "",
      String(emp.maChucNang ?? ""),
      String(emp.maQuanLy ?? "")
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
          <Users className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý nhân viên</h1>
            <p className="text-gray-600">Quản lý thông tin nhân viên trong hệ thống</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Thêm nhân viên
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {term ? "Không tìm thấy nhân viên" : "Chưa có nhân viên nào"}
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã NV</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số điện thoại</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày sinh</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã chức năng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã quản lý</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((employee) => (
                <tr key={employee.maNhanVien} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{employee.maNhanVien}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{employee.hoTen}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{employee.email || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{employee.soDienThoai || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(employee.ngaySinh)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{employee.diaChi || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{employee.maChucNang ?? "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{employee.maQuanLy ?? "N/A"}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(employee.maNhanVien)}
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
