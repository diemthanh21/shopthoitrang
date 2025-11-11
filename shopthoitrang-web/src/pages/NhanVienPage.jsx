// src/pages/NhanVienPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Users, Plus, Search, Edit, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import nhanvienService from "../services/nhanvienService";
import chucnangService from "../services/chucnangService";
import AddressVNCompact from "../components/AddressVNCompact";

// ===== Helpers (có thể tách ra utils nếu muốn) =====
function calcAge(yyyyMmDd) {
  if (!yyyyMmDd) return 0;
  const d = new Date(yyyyMmDd);
  if (Number.isNaN(d.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}
function isValidEmail(v) {
  if (!v) return true; // cho phép trống
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function formatDate(v) {
  if (!v) return "N/A";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return String(v);
  }
}

export default function NhanVienPage() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [functions, setFunctions] = useState([]); // { machucnang/maChucNang, tenchucnang/tenChucNang }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  // State form thêm mới  đầy đủ thuộc tính
  const [newEmployee, setNewEmployee] = useState({
    hoten: "",
    gioitinh: "",        // "Nam" | "Nữ" 
    cccd: "",
    ngaycap: "",         // yyyy-mm-dd
    noicap: "",
    ngaybatdau: "",
    ngayhethan: "",
    trangthai: "Đang làm", // "Đang làm" | "Tạm nghỉ" | "Đã nghỉ"
    luong: "",           // số
    email: "",
    sodienthoai: "",
    ngaysinh: "",
    machucnang: "",
    maquanly: "",
  });

  // Địa chỉ theo mô hình TỈNH → XÃ (+ Thôn/Tổ)
  // AddressVNCompact sẽ set kèm name để không phải fetch lại
  const [addr, setAddr] = useState({
    provinceCode: "",
    provinceName: "",
    wardCode: "",
    wardName: "",
    hamlet: "",
  });

  // ===== Load data =====
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [emps, funcs] = await Promise.all([
          nhanvienService.getAll(),
          chucnangService.getAll(),
        ]);
        setEmployees(emps);          // emps đã normalize về camelCase trong service
        setFunctions(funcs || []);   // có thể snake/camel  xử lý khi hiển thị
        setError("");
      } catch (e) {
        console.error(e);
        setError("Không thể tải dữ liệu nhân viên hoặc chức năng.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ===== Search =====
  const term = searchTerm.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!term) return employees;
    return employees.filter((emp) => {
      const cells = [
        String(emp.maNhanVien ?? ""),
        emp.hoTen ?? "",
        emp.email ?? "",
        emp.soDienThoai ?? "",
        emp.diaChi ?? "",
        formatDate(emp.ngaySinh),
        String(emp.maChucNang ?? ""),
        String(emp.maQuanLy ?? ""),
      ].map((x) => (x ?? "").toString().toLowerCase());
      return cells.some((c) => c.includes(term));
    });
  }, [employees, term]);

  // ===== Xoá =====
  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;
    try {
      await nhanvienService.delete(id);
      setEmployees((prev) => prev.filter((x) => x.maNhanVien !== id));
    } catch (e) {
      console.error(e);
      alert("Không thể xóa nhân viên.");
    }
  }

  // ===== Map id -> tên chức năng =====
  function getTenChucNang(maChucNang) {
    if (!maChucNang) return "N/A";
    const found = functions.find(
      (f) =>
        f.machucnang === maChucNang ||
        f.maChucNang === maChucNang ||
        Number(f.machucnang) === Number(maChucNang) ||
        Number(f.maChucNang) === Number(maChucNang)
    );
    return found?.tenchucnang || found?.tenChucNang || `#${maChucNang}`;
  }

  // ===== Tạo mới =====
  async function handleCreate(e) {
    e.preventDefault();

    // Validate cơ bản
    if (!newEmployee.hoten || !newEmployee.machucnang) {
      alert("Vui lòng nhập Họ tên và chọn Chức năng.");
      return;
    }
    if (!isValidEmail(newEmployee.email)) {
      alert("Email không hợp lệ.");
      return;
    }
    const emailLower = (newEmployee.email || "").trim().toLowerCase();
    if (emailLower && employees.some((x) => (x.email || "").toLowerCase() === emailLower)) {
      alert("Email đã tồn tại, vui lòng dùng email khác.");
      return;
    }
    if (newEmployee.sodienthoai && !/^\d{10}$/.test(newEmployee.sodienthoai)) {
      alert("Số điện thoại phải gồm đúng 10 chữ số.");
      return;
    }
    if (newEmployee.cccd && !/^(\d{9}|\d{12})$/.test(newEmployee.cccd)) {
      alert("CCCD phải gồm 9 hoặc 12 chữ số.");
      return;
    }
    if (newEmployee.ngaysinh) {
      const age = calcAge(newEmployee.ngaysinh);
      if (age < 18) {
        alert("Nhân viên phải từ 18 tuổi trở lên.");
        return;
      }
    }
    if (newEmployee.luong !== "" && Number(newEmployee.luong) < 0) {
      alert("Lương không hợp lệ.");
      return;
    }

    // Gộp địa chỉ theo mô hình mới (Thôn/Tổ, Xã/Phường, Tỉnh/TP)
    const diachiText = [addr.hamlet, addr.wardName, addr.provinceName]
      .filter(Boolean)
      .join(", ");

    try {
      const created = await nhanvienService.create({
        hoten: newEmployee.hoten,
        gioitinh: newEmployee.gioitinh || null,
        cccd: newEmployee.cccd || null,
        ngaycap: newEmployee.ngaycap || null,
        noicap: newEmployee.noicap || null,
        ngaybatdau: newEmployee.ngaybatdau || null,
        ngayhethan: newEmployee.ngayhethan || null,
        trangthai: newEmployee.trangthai || null,
        luong: newEmployee.luong === "" ? null : Number(newEmployee.luong),
        email: newEmployee.email || null,
        sodienthoai: newEmployee.sodienthoai || null,
        ngaysinh: newEmployee.ngaysinh || null,
        diachi: diachiText || null, // <-- địa chỉ gộp theo mô hình Tỉnh → Xã (+Thôn)
        machucnang: newEmployee.machucnang ? Number(newEmployee.machucnang) : null,
        maquanly: newEmployee.maquanly ? Number(newEmployee.maquanly) : null,
        // Nếu DB của bạn có thêm cột code/name cho province/ward/hamlet thì thêm vào service.buildBody
        // province_code: addr.provinceCode ? Number(addr.provinceCode) : null,
        // province_name: addr.provinceName || null,
        // ward_code: addr.wardCode ? Number(addr.wardCode) : null,
        // ward_name: addr.wardName || null,
        // hamlet: addr.hamlet || null,
      });

      setEmployees((prev) => [created, ...prev]);
      setShowForm(false);
      // reset form
      setNewEmployee({
        hoten: "",
        gioitinh: "",
        cccd: "",
        ngaycap: "",
        noicap: "",
        ngaybatdau: "",
        ngayhethan: "",
        trangthai: "Đang làm",
        luong: "",
        email: "",
        sodienthoai: "",
        ngaysinh: "",
        machucnang: "",
        maquanly: "",
      });
      setAddr({
        provinceCode: "",
        provinceName: "",
        wardCode: "",
        wardName: "",
        hamlet: "",
      });
    } catch (e) {
      console.error(e);
      alert(e?.message || "Không thể tạo nhân viên.");
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
          <Users className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý nhân viên</h1>
            <p className="text-gray-600">Quản lý thông tin nhân viên trong hệ thống</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Thêm nhân viên
        </button>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, chức năng, quản lý..."
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã NV</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Họ tên</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SĐT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ngày sinh</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Giới tính</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Chức năng</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((e) => (
                <tr key={e.maNhanVien} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.maNhanVien}</td>
                  <td className="px-4 py-3 text-sm">{e.hoTen}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{e.email || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{e.soDienThoai || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(e.ngaySinh)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{e.gioiTinh ?? e.gioitinh ?? "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{getTenChucNang(e.maChucNang)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/nhanvien/${e.maNhanVien}`)}
                      className="text-green-600 hover:text-green-800 mr-3"
                      title="Chi tiết"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Thêm mới */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">Thêm nhân viên mới</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Họ tên + Giới tính */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Họ tên *</label>
                  <input
                    value={newEmployee.hoten}
                    onChange={(e) => setNewEmployee({ ...newEmployee, hoten: e.target.value })}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giới tính</label>
                  <select
                    value={newEmployee.gioitinh}
                    onChange={(e) => setNewEmployee({ ...newEmployee, gioitinh: e.target.value })}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chưa chọn --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              {/* Email + SĐT */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                  <input
                    value={newEmployee.sodienthoai}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setNewEmployee({ ...newEmployee, sodienthoai: digits });
                    }}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0901234567"
                  />
                </div>
              </div>

              {/* Ngày sinh + Chức năng */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={newEmployee.ngaysinh}
                    onChange={(e) => setNewEmployee({ ...newEmployee, ngaysinh: e.target.value })}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Chức năng *</label>
                  <select
                    value={newEmployee.machucnang}
                    onChange={(e) => setNewEmployee({ ...newEmployee, machucnang: e.target.value })}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Chọn chức năng --</option>
                    {functions.map((f) => (
                      <option key={f.machucnang ?? f.maChucNang} value={f.machucnang ?? f.maChucNang}>
                        {f.tenchucnang ?? f.tenChucNang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CCCD + Ngày cấp */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CCCD</label>
                  <input
                    value={newEmployee.cccd}
                    onChange={(e) => setNewEmployee({ ...newEmployee, cccd: e.target.value.replace(/\D/g, "") })}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="123456789012"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày cấp</label>
                  <input
                    type="date"
                    value={newEmployee.ngaycap}
                    onChange={(e) => setNewEmployee({ ...newEmployee, ngaycap: e.target.value })}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Nơi cấp + Trạng thái */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nơi cấp</label>
                  <input
                    value={newEmployee.noicap}
                    onChange={(e) => setNewEmployee({ ...newEmployee, noicap: e.target.value })}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Hà Nội"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select
                    value={newEmployee.trangthai}
                    onChange={(e) => setNewEmployee({ ...newEmployee, trangthai: e.target.value })}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Đang làm</option>
                    <option>Tạm nghỉ</option>
                    <option>Đã nghỉ</option>
                  </select>
                </div>
              </div>

              {/* Ngày bắt đầu + Ngày hết hạn */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={newEmployee.ngaybatdau}
                    onChange={(e) => setNewEmployee({ ...newEmployee, ngaybatdau: e.target.value })}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày hết hạn</label>
                  <input
                    type="date"
                    value={newEmployee.ngayhethan}
                    onChange={(e) => setNewEmployee({ ...newEmployee, ngayhethan: e.target.value })}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Lương */}
              <div>
                <label className="block text-sm font-medium mb-1">Lương (₫)</label>
                <input
                  type="number"
                  min="0"
                  value={newEmployee.luong}
                  onChange={(e) => setNewEmployee({ ...newEmployee, luong: e.target.value })}
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="13000000"
                />
              </div>

              {/* Địa chỉ: Tỉnh → Xã (+Thôn/Tổ) */}
              <div>
                <label className="block text-sm font-medium mb-2">Địa chỉ</label>
                <AddressVNCompact value={addr} onChange={setAddr} />
              </div>

              {/* Người quản lý */}
              <div>
                <label className="block text-sm font-medium mb-1">Người quản lý</label>
                <select
                  value={newEmployee.maquanly}
                  onChange={(e) => setNewEmployee({ ...newEmployee, maquanly: e.target.value })}
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Không có --</option>
                  {employees.map((m) => (
                    <option key={m.maNhanVien} value={m.maNhanVien}>
                      {m.hoTen}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
                  Lưu nhân viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
