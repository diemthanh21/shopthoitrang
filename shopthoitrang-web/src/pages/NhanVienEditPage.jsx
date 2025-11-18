import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Save, X, Mail, Phone, Calendar, IdCard, BadgeDollarSign, ShieldCheck, User, MapPin
} from "lucide-react";
import nhanvienService from "../services/nhanvienService";
import chucnangService from "../services/chucnangService";
import AddressVN from "../components/AddressVNCompact";
import { useAuth } from "../contexts/AuthContext";

function isValidEmail(v){ if(!v) return true; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function calcAge(yyyyMmDd){
  if(!yyyyMmDd) return 0;
  const d=new Date(yyyyMmDd); if(Number.isNaN(d.getTime())) return 0;
  const t=new Date(); let age=t.getFullYear()-d.getFullYear();
  const m=t.getMonth()-d.getMonth(); if(m<0||(m===0&&t.getDate()<d.getDate())) age--; return age;
}

export default function NhanVienEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.maQuyen === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [employee, setEmployee] = useState(null);

  // danh sách chức năng (dropdown)
  const [functions, setFunctions] = useState([]);

  // form state
  const [form, setForm] = useState({
    hoten: "", gioitinh: "", cccd: "", ngaycap: "", noicap: "",
    ngaybatdau: "", ngayhethan: "", trangthai: "Đang làm", luong: "",
    email: "", sodienthoai: "", ngaysinh: "", machucnang: ""
  });

  // địa chỉ theo mô hình mới
  const [addr, setAddr] = useState({
    provinceCode: "", provinceName: "",
    wardCode: "", wardName: "",
    hamlet: ""
  });

  // tải dữ liệu + chức năng
  useEffect(() => {
    (async () => {
      // Quyền truy cập: ADMIN hoặc chính chủ (chỉnh sửa thông tin của chính mình)
      const isAdmin = user?.maQuyen === 'ADMIN';
      const myId = String(user?.maNhanVien ?? user?.manhanvien ?? "");
      if (!isAdmin && myId !== String(id)) {
        alert('Bạn không có quyền truy cập trang này');
        navigate(-1);
        return;
      }
      try {
        setLoading(true);
        const [emp, funcs] = await Promise.all([
          nhanvienService.getById(id),
          chucnangService.getAll()
        ]);

        setEmployee(emp);
        setFunctions(funcs || []);

        // map vào form
        setForm({
          hoten: emp.hoTen ?? "",
          gioitinh: emp.gioiTinh ?? "",
          cccd: emp.cccd ?? "",
          ngaycap: emp.ngayCap ? emp.ngayCap?.slice(0,10) : "",
          noicap: emp.noiCap ?? "",
          ngaybatdau: emp.ngayBatDau ? emp.ngayBatDau?.slice(0,10) : "",
          ngayhethan: emp.ngayHetHan ? emp.ngayHetHan?.slice(0,10) : "",
          trangthai: emp.trangThai ?? "Đang làm",
          luong: emp.luong ?? "",
          email: emp.email ?? "",
          sodienthoai: emp.soDienThoai ?? "",
          ngaysinh: emp.ngaySinh ? emp.ngaySinh?.slice(0,10) : "",
          machucnang: emp.maChucNang ?? "",
        });

        // khởi tạo địa chỉ từ chuỗi: "Thôn, Xã, Tỉnh"
        const dia = (emp.diaChi || "").split(",").map(s=>s.trim());
        setAddr({
          hamlet: dia[0] || "",
          wardName: dia[1] || "",
          provinceName: dia[2] || "",
          wardCode: "",
          provinceCode: ""
        });

        setError("");
      } catch (e) {
        console.error(e);
        setError("Không thể tải dữ liệu nhân viên hoặc danh sách chức năng.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSubmit(e){
    e.preventDefault();

    // validate
    if(!form.hoten){ alert("Vui lòng nhập Họ tên."); return; }
    if(!isValidEmail(form.email)){ alert("Email không hợp lệ."); return; }
    if(form.sodienthoai && !/^\d{10}$/.test(form.sodienthoai)){ alert("SĐT phải gồm 10 số."); return; }
    if(form.cccd && !/^(\d{9}|\d{12})$/.test(form.cccd)){ alert("CCCD phải 9 hoặc 12 số."); return; }
    if(form.ngaysinh){
      const age = calcAge(form.ngaysinh);
      if(age<18){ alert("Nhân viên phải từ 18 tuổi trở lên."); return; }
    }
    if(form.luong!=="" && Number(form.luong)<0){ alert("Lương không hợp lệ."); return; }
    if(isAdmin && !form.machucnang){ alert("Vui lòng chọn Chức năng."); return; }

    const diachiText = [addr.hamlet, addr.wardName, addr.provinceName]
      .filter(Boolean).join(", ");

    try{
      setSaving(true);
      const payload = {
        hoten: form.hoten,
        gioitinh: form.gioitinh || null,
        cccd: form.cccd || null,
        ngaycap: form.ngaycap || null,
        noicap: form.noicap || null,
        ngaybatdau: form.ngaybatdau || null,
        ngayhethan: form.ngayhethan || null,
        trangthai: form.trangthai || null,
        luong: form.luong === "" ? null : Number(form.luong),
        email: form.email || null,
        sodienthoai: form.sodienthoai || null,
        ngaysinh: form.ngaysinh || null,
        diaChi: diachiText || employee?.diaChi || null,
        machucnang: form.machucnang ? Number(form.machucnang) : null,
      };

      await nhanvienService.update(id, payload);
      // quay lại trang chi tiết (không dùng -1 để đảm bảo luôn đúng)
      navigate(`/nhanvien/${id}`);
    }catch(err){
      console.error(err);
      alert(err?.message || "Cập nhật thất bại.");
    }finally{
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-600 text-lg">Đang tải…</div>;
  if (error)   return <div className="p-8 text-center text-red-600 text-lg">{error}</div>;
  if (!employee) return <div className="p-8 text-center text-gray-500 text-lg">Không tìm thấy.</div>;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="mx-auto max-w-[1200px] px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/nhanvien/${id}`)}
              className="flex items-center gap-2 text:white/90 hover:text-white"
            >
              <ArrowLeft size={18} /> Quay lại chi tiết
            </button>
            <h1 className="text-2xl font-bold">Chỉnh sửa nhân viên #{employee.maNhanVien}</h1>
            <div />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
          {/* Họ tên + Giới tính */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Họ tên *" icon={<User size={16}/>}>
              <input
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.hoten}
                onChange={(e)=>setForm({...form, hoten: e.target.value})}
                required
              />
            </Field>
            <Field label="Giới tính">
              <select
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.gioitinh}
                onChange={(e)=>setForm({...form, gioitinh: e.target.value})}
              >
                <option value="">-- Chưa chọn --</option>
                <option>Nam</option>
                <option>Nữ</option>
                <option>Khác</option>
              </select>
            </Field>
          </div>

          {/* Email + SĐT */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Email" icon={<Mail size={16}/>}>
              <input
                type="email"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.email}
                onChange={(e)=>setForm({...form, email: e.target.value})}
                placeholder="email@example.com"
              />
            </Field>
            <Field label="Số điện thoại" icon={<Phone size={16}/>}>
              <input
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.sodienthoai}
                onChange={(e)=>setForm({...form, sodienthoai: e.target.value.replace(/\D/g,"").slice(0,10)})}
                placeholder="0901234567"
              />
            </Field>
          </div>

          {/* Ngày sinh + Lương */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Ngày sinh" icon={<Calendar size={16}/>}>
              <input
                type="date"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.ngaysinh}
                onChange={(e)=>setForm({...form, ngaysinh: e.target.value})}
              />
            </Field>
            <Field label="Lương (₫)" icon={<BadgeDollarSign size={16}/>}>
              <input
                type="number" min="0"
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={form.luong}
                  onChange={(e)=>setForm({...form, luong: e.target.value})}
                  placeholder="13000000"
                  disabled={!isAdmin}
              />
            </Field>
          </div>

          {/* CCCD + Ngày cấp */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="CCCD" icon={<IdCard size={16}/>}>
              <input
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.cccd}
                onChange={(e)=>setForm({...form, cccd: e.target.value.replace(/\D/g,"")})}
                placeholder="123456789012"
              />
            </Field>
            <Field label="Ngày cấp">
              <input
                type="date"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.ngaycap}
                onChange={(e)=>setForm({...form, ngaycap: e.target.value})}
              />
            </Field>
          </div>

          {/* Nơi cấp + Trạng thái */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nơi cấp">
              <input
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.noicap}
                onChange={(e)=>setForm({...form, noicap: e.target.value})}
                placeholder="Hà Nội"
              />
            </Field>
            <Field label="Trạng thái" icon={<ShieldCheck size={16}/>}>
              <select
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.trangthai}
                onChange={(e)=>setForm({...form, trangthai: e.target.value})}
                disabled={!isAdmin}
              >
                <option>Đang làm</option>
                <option>Tạm nghỉ</option>
                <option>Đã nghỉ</option>
              </select>
            </Field>
          </div>

          {/* Ngày bắt đầu + Ngày hết hạn */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Ngày bắt đầu">
              <input
                type="date"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.ngaybatdau}
                onChange={(e)=>setForm({...form, ngaybatdau: e.target.value})}
                disabled={!isAdmin}
              />
            </Field>
            <Field label="Ngày hết hạn">
              <input
                type="date"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.ngayhethan}
                onChange={(e)=>setForm({...form, ngayhethan: e.target.value})}
                disabled={!isAdmin}
              />
            </Field>
          </div>

          {/* Địa chỉ (AddressVN) */}
          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ</label>
            <AddressVN value={addr} onChange={setAddr} />
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <MapPin size={14}/> Gộp: { [addr.hamlet, addr.wardName, addr.provinceName].filter(Boolean).join(", ") || (employee?.diaChi || "") }
            </p>
          </div>

          {/* Chức năng (dropdown tên) */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Chức năng *" icon={<ShieldCheck size={16}/>}>
              <select
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.machucnang}
                onChange={(e)=>setForm({...form, machucnang: e.target.value})}
                required
                disabled={!isAdmin}
              >
                <option value="">-- Chọn chức năng --</option>
                {functions.map((f) => {
                  const id = f.machucnang ?? f.maChucNang;
                  const name = f.tenchucnang ?? f.tenChucNang;
                  return <option key={id} value={id}>{name}</option>;
                })}
              </select>
            </Field>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              to={`/nhanvien/${id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              <X size={16}/> Hủy
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Save size={16}/> {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- components phụ ---------- */
function Field({ label, icon, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        <span className="inline-flex items-center gap-1">{icon}{label}</span>
      </label>
      {children}
    </div>
  );
}