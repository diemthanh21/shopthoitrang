import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import nhanvienService from "../services/nhanvienService";
import chucnangService from "../services/chucnangService";
import taikhoannhanvienService from "../services/taikhoannhanvienService";
import { formatDate } from "../utils/nhanvienUtils";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Pencil,
  IdCard,
  BadgeDollarSign,
  ShieldCheck,
} from "lucide-react";

export default function ThongTinNhanVienPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chucnangMap, setChucnangMap] = useState({});
  const [account, setAccount] = useState(null);
  const [manager, setManager] = useState(null);

  const maNhanVien =
    user?.maNhanVien ?? user?.manhanvien ?? user?.id ?? user?.maNhanVien ?? null;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!maNhanVien) return;
      setLoading(true);
      try {
        const [emp, chucList, acc] = await Promise.all([
          nhanvienService.getById(maNhanVien),
          chucnangService.getAll(),
          taikhoannhanvienService.getById(maNhanVien).catch(() => null),
        ]);

        if (!mounted) return;
        setEmployee(emp || null);
        setAccount(acc || null);

        const map = {};
        (chucList || []).forEach((c) => {
          map[c.maChucNang] = c.tenChucNang;
        });
        setChucnangMap(map);

        const mgrId = emp?.maQuanLy ?? emp?.maquanly ?? null;
        if (mgrId) {
          try {
            const mgr = await nhanvienService.getById(mgrId);
            if (mounted) setManager(mgr || null);
          } catch {
            if (mounted) setManager(null);
          }
        }

        setError("");
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setError("Không thể tải thông tin nhân viên.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [maNhanVien]);

  if (!user) return <div className="p-8">Không có thông tin người dùng.</div>;

  const initials = (employee?.hoTen ?? user?.hoTen ?? user?.hoten ?? "?").trim().charAt(0).toUpperCase();
  const currency = employee?.luong != null ? `${Number(employee.luong).toLocaleString("vi-VN")} ₫` : "—";
  const tenChucNang = (employee?.maChucNang && chucnangMap[employee.maChucNang]) || "—";

  return (
    <div className="w-full">
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
                <h1 className="text-3xl font-bold leading-tight">Hồ sơ nhân viên #{employee?.maNhanVien ?? "—"}</h1>
                <p className="text-white/80">{employee?.hoTen ?? user?.hoTen ?? user?.hoten}</p>
              </div>
            </div>

            {(employee?.maNhanVien && (user?.maQuyen === "ADMIN" || String(user?.maNhanVien) === String(employee.maNhanVien))) && (
              <button
                onClick={() => navigate(`/nhanvien/${employee.maNhanVien}/edit`)}
                className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
              >
                <Pencil size={18} /> Chỉnh sửa
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center text-4xl font-bold mx-auto">
                {initials}
              </div>
              <h2 className="text-xl font-semibold text-center mt-4">{employee?.hoTen ?? user?.hoTen ?? user?.hoten}</h2>
              <p className="text-center text-gray-500">Trạng thái: {employee?.trangThai ?? "Đang làm việc"}</p>
              <div className="mt-6 space-y-3 text-sm">
                <QuickItem icon={<User size={16} />} label="Giới tính" value={employee?.gioiTinh} />
                <QuickItem icon={<Calendar size={16} />} label="Ngày sinh" value={formatDate(employee?.ngaySinh)} />
                <QuickItem icon={<IdCard size={16} />} label="CCCD" value={employee?.cccd} />
                <QuickItem icon={<ShieldCheck size={16} />} label="Chức năng" value={tenChucNang} />
                <QuickItem icon={<BadgeDollarSign size={16} />} label="Lương" value={currency} />
              </div>
            </div>
          </aside>

          <main className="col-span-12 lg:col-span-9 space-y-6">
            <Card title="Thông tin liên hệ">
              <div className="grid md:grid-cols-2 gap-6">
                <InfoRow icon={<Mail size={18} />} label="Email" value={employee?.email} />
                <InfoRow icon={<Phone size={18} />} label="Số điện thoại" value={employee?.soDienThoai} />
                <InfoRow icon={<MapPin size={18} />} label="Địa chỉ" value={employee?.diaChi} />
              </div>
            </Card>

            <Card title="Thông tin pháp lý & hợp đồng">
              <div className="grid md:grid-cols-2 gap-6">
                <InfoRow label="Ngày cấp CCCD" value={formatDate(employee?.ngayCap)} />
                <InfoRow label="Nơi cấp CCCD" value={employee?.noiCap} />
                <InfoRow label="Ngày bắt đầu" value={formatDate(employee?.ngayBatDau)} />
                <InfoRow label="Ngày hết hạn" value={formatDate(employee?.ngayHetHan)} />
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

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
