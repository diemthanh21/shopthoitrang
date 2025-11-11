// src/pages/NhanVienDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import nhanvienService from "../services/nhanvienService";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, User, Pencil,
  IdCard, BadgeDollarSign, ShieldCheck
} from "lucide-react";
import { formatDate } from "../utils/nhanvienUtils";

export default function NhanVienDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await nhanvienService.getById(id);
        setEmployee(data);
        setError("");
      } catch (e) {
        console.error(e);
        setError("Không thể tải thông tin nhân viên.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-600 text-lg">Đang tải dữ liệu…</div>;
  if (error) return <div className="p-8 text-center text-red-600 text-lg">{error}</div>;
  if (!employee) return <div className="p-8 text-center text-gray-500 text-lg">Không tìm thấy nhân viên.</div>;

  const initials = (employee.hoTen || "?").trim().charAt(0).toUpperCase();
  const currency = employee.luong != null ? `${Number(employee.luong).toLocaleString("vi-VN")} ₫` : "N/A";

  return (
    <div className="w-full">
      {/* HERO HEADER full-width */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
         <button
            onClick={() => navigate("/nhanvien")}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4"
          >
            <ArrowLeft size={18} /> Quay lại danh sách
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold leading-tight">
                  Hồ sơ nhân viên #{employee.maNhanVien}
                </h1>
                <p className="text-white/80">{employee.hoTen}</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/nhanvien/${employee.maNhanVien}/edit`)}
              className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
            > <Pencil size={18} /> Chỉnh sửa</button>
          </div>
        </div>
      </div>

      {/* CONTENT max 1400px để nhìn thoáng mà vẫn full-page */}
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* GRID 12 CỘT: sidebar + nội dung */}
        <div className="grid grid-cols-12 gap-6">
          {/* SIDEBAR (thông tin nhanh) */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white
                              flex items-center justify-center text-4xl font-bold mx-auto">
                {initials}
              </div>
              <h2 className="text-xl font-semibold text-center mt-4">{employee.hoTen}</h2>
              <p className="text-center text-gray-500">
                Trạng thái: {employee.trangThai ?? "Đang làm việc"}
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <QuickItem icon={<User size={16} />} label="Giới tính" value={employee.gioiTinh} />
                <QuickItem icon={<Calendar size={16} />} label="Ngày sinh" value={formatDate(employee.ngaySinh)} />
                <QuickItem icon={<IdCard size={16} />} label="CCCD" value={employee.cccd} />
                <QuickItem icon={<ShieldCheck size={16} />} label="Chức năng" value={employee.maChucNang ?? "N/A"} />
                <QuickItem icon={<BadgeDollarSign size={16} />} label="Lương" value={currency} />
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="col-span-12 lg:col-span-9 space-y-6">
            {/* Thông tin liên hệ */}
            <Card title="Thông tin liên hệ">
              <div className="grid md:grid-cols-2 gap-6">
                <InfoRow icon={<Mail size={18} />} label="Email" value={employee.email} />
                <InfoRow icon={<Phone size={18} />} label="Số điện thoại" value={employee.soDienThoai} />
                <InfoRow icon={<MapPin size={18} />} label="Địa chỉ" value={employee.diaChi} />
              </div>
            </Card>

            {/* Thông tin pháp lý / hợp đồng */}
            <Card title="Thông tin pháp lý & hợp đồng">
              <div className="grid md:grid-cols-2 gap-6">
                <InfoRow label="Ngày cấp CCCD" value={formatDate(employee.ngayCap)} />
                <InfoRow label="Nơi cấp CCCD" value={employee.noiCap} />
                <InfoRow label="Ngày bắt đầu" value={formatDate(employee.ngayBatDau)} />
                <InfoRow label="Ngày hết hạn" value={formatDate(employee.ngayHetHan)} />
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

/*  Components phụ  */

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      {icon ? <div className="text-blue-600 mt-0.5">{icon}</div> : null}
      <div className="flex-1 border-b border-gray-100 pb-3">
        <p className="text-xs uppercase text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value ?? "N/A"}</p>
      </div>
    </div>
  );
}

function QuickItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-blue-600">{icon}</span>
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium text-gray-800">{value ?? "N/A"}</span>
    </div>
  );
}
