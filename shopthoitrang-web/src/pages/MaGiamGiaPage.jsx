// src/pages/MaGiamGiaPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
} from "lucide-react";

import magiamgiaService from "../services/magiamgiaService";
import nhanvienService from "../services/nhanvienService";
import { useAuth } from "../contexts/AuthContext";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN") : "";

const fmtCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

export default function MaGiamGiaPage() {
  const { user } = useAuth();

  const currentMaNhanVien =
    user?.maNhanVien ??
    user?.manhanvien ??
    user?.nhanVien?.maNhanVien ??
    user?.nhanvien?.manhanvien ??
    "";

  const currentTenNhanVien =
    user?.hoTen ??
    user?.hoten ??
    user?.nhanVien?.hoTen ??
    user?.nhanvien?.hoten ??
    user?.fullName ??
    "";

  // ===== ROLE / QUYỀN =====
  const currentRoleRaw =
    user?.maQuyen ??
    user?.maquyen ??
    user?.nhanVien?.maQuyen ??
    user?.nhanvien?.maquyen ??
    user?.nhanVien?.chucNang?.maQuyen ??
    user?.nhanvien?.chucnang?.maquyen ??
    user?.chucNang?.maQuyen ??
    user?.chucnang?.maquyen ??
    "";

  const currentRole = String(currentRoleRaw || "").toUpperCase();
  const isAdmin = currentRole === "ADMIN";
  const isManager = currentRole === "MANAGER";
  const isAdminOrManager = isAdmin || isManager;

  const canCreate = isAdminOrManager;
  const canEditAny = isAdminOrManager;
  const canDeleteAny = isAdminOrManager;

  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    maCode: "",
    tenMaGiamGia: "",
    moTa: "",
    hinhThucGiam: "AMOUNT", // AMOUNT | PERCENT | FREESHIP
    soTienGiam: "",
    phanTramGiam: "",
    giamToiDa: "",
    dieuKienDonToiThieu: "",
    soLuong: "",
    ngayBatDau: "",
    ngayKetThuc: "",
    chiApDungSinhNhat: false,
    maNhanVien: "",
  });

  // ===== Helpers: id -> tên nhân viên =====
  const getTenNhanVien = (maNV) => {
    if (!maNV) return "";
    const found = employees.find((e) => {
      const id = e.maNhanVien ?? e.manhanvien ?? e.id;
      return Number(id) === Number(maNV);
    });
    return found?.hoTen ?? found?.hoten ?? `NV #${maNV}`;
  };

  // ===== Trạng thái voucher =====
  const getTrangThaiVoucher = (v) => {
    const today = new Date();
    const dToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();

    const startRaw = v.ngayBatDau ?? v.ngaybatdau;
    const endRaw = v.ngayKetThuc ?? v.ngayketthuc;

    const soLuongConLai =
      v.soLuongConLai ??
      v.soluongconlai ??
      v.so_luong_con_lai ??
      v.soLuong ??
      0;

    const dStart = startRaw
      ? new Date(startRaw).setHours(0, 0, 0, 0)
      : null;
    const dEnd = endRaw ? new Date(endRaw).setHours(0, 0, 0, 0) : null;

    if (soLuongConLai <= 0) {
      return {
        code: "OUT_OF_STOCK",
        label: "Hết lượt",
        color: "bg-red-100 text-red-700",
      };
    }

    if (!dStart && !dEnd) {
      return {
        code: "UNKNOWN",
        label: "Không xác định",
        color: "bg-gray-100 text-gray-700",
      };
    }

    if (dStart && dToday < dStart) {
      return {
        code: "UPCOMING",
        label: "Sắp diễn ra",
        color: "bg-blue-100 text-blue-700",
      };
    }

    if (dEnd && dToday > dEnd) {
      return {
        code: "ENDED",
        label: "Đã kết thúc",
        color: "bg-red-100 text-red-700",
      };
    }

    return {
      code: "ONGOING",
      label: "Đang diễn ra",
      color: "bg-green-100 text-green-700",
    };
  };

  // ===== Mô tả nội dung giảm =====
  const getDiscountSummary = (v) => {
    const type = v.hinhThucGiam;
    if (type === "PERCENT") {
      const percent = v.phanTramGiam || 0;
      const max = v.giamToiDa;
      return max
        ? `Giảm ${percent}% (tối đa ${fmtCurrency(max)})`
        : `Giảm ${percent}%`;
    }
    if (type === "FREESHIP") {
      if (v.giamToiDa) {
        return `Freeship, tối đa ${fmtCurrency(v.giamToiDa)}`;
      }
      return "Freeship";
    }
    // AMOUNT
    return `Giảm ${fmtCurrency(v.soTienGiam || 0)}`;
  };

  // ===== Load dữ liệu =====
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const [vouchers, emps] = await Promise.all([
          magiamgiaService.getAll(),
          nhanvienService.getAll(),
        ]);

        setItems(Array.isArray(vouchers) ? vouchers : []);
        setEmployees(Array.isArray(emps) ? emps : []);
      } catch (e) {
        console.error(e);
        setError("Không thể tải danh sách mã giảm giá / nhân viên");
        setItems([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ===== Tìm kiếm =====
  const term = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      items.filter((v) => {
        if (!term) return true;

        const tenNV = getTenNhanVien(v.maNhanVien);
        const { label: statusLabel } = getTrangThaiVoucher(v);

        const minOrder =
          v.dieuKienDonToiThieu != null
            ? v.dieuKienDonToiThieu
            : "";

        const hay = [
          v.maVoucher,
          v.maCode,
          v.tenMaGiamGia,
          v.moTa,
          v.hinhThucGiam,
          v.typeLabel,
          v.soTienGiam,
          v.phanTramGiam,
          v.giamToiDa,
          minOrder,
          v.soLuong,
          v.soLuongDaDung,
          v.soLuongConLai,
          v.isBirthdayOnly ? "sinh nhat" : "",
          tenNV,
          statusLabel,
        ]
          .map((x) => String(x ?? "").toLowerCase())
          .join(" ");

        return hay.includes(term);
      }),
    [items, term, employees]
  );

  // ===== Quyền theo từng voucher =====
  const canEditVoucher = (voucher) => {
    if (!canEditAny || !voucher) return false;
    const status = getTrangThaiVoucher(voucher);
    if (status.code === "ENDED") return false;
    return true;
  };

  const canDeleteVoucher = (voucher) => {
    if (!canDeleteAny || !voucher) return false;
    const status = getTrangThaiVoucher(voucher);
    const isOngoingLike =
      status.code === "ONGOING" || status.code === "OUT_OF_STOCK";
    if (status.code === "ENDED" || isOngoingLike) return false;
    // chỉ cho xoá khi sắp diễn ra / unknown
    return true;
  };

  // ===== Mở form Thêm / Sửa =====
  const openAddForm = () => {
    if (!canCreate) {
      alert("Bạn không có quyền tạo mã giảm giá.");
      return;
    }
    setEditingItem(null);
    setFormData({
      maCode: "",
      tenMaGiamGia: "",
      moTa: "",
      hinhThucGiam: "AMOUNT",
      soTienGiam: "",
      phanTramGiam: "",
      giamToiDa: "",
      dieuKienDonToiThieu: "",
      soLuong: "",
      ngayBatDau: "",
      ngayKetThuc: "",
      chiApDungSinhNhat: false,
      maNhanVien: currentMaNhanVien || "",
    });
    setShowForm(true);
  };

  const openEditForm = (item) => {
    if (!canEditVoucher(item)) return;

    setEditingItem(item);
    setFormData({
      maCode: item.maCode ?? "",
      tenMaGiamGia: item.tenMaGiamGia ?? "",
      moTa: item.moTa ?? "",
      hinhThucGiam: item.hinhThucGiam ?? "AMOUNT",
      soTienGiam: item.soTienGiam ?? "",
      phanTramGiam: item.phanTramGiam ?? "",
      giamToiDa: item.giamToiDa ?? "",
      dieuKienDonToiThieu: item.dieuKienDonToiThieu ?? "",
      soLuong: item.soLuong ?? "",
      ngayBatDau: item.ngayBatDau ?? "",
      ngayKetThuc: item.ngayKetThuc ?? "",
      chiApDungSinhNhat: !!item.chiApDungSinhNhat,
      maNhanVien:
        item.maNhanVien ??
        currentMaNhanVien ??
        "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // ===== Xoá =====
  const handleDelete = async (voucher) => {
    if (!canDeleteVoucher(voucher)) return;
    if (!window.confirm("Xoá mã giảm giá này?")) return;
    try {
      await magiamgiaService.delete(voucher.maVoucher);
      const newList = await magiamgiaService.getAll();
      setItems(Array.isArray(newList) ? newList : []);
    } catch (e) {
      console.error(e);
      alert("Không thể xoá mã giảm giá");
    }
  };

  // ===== Trạng thái của voucher đang sửa =====
  const editingStatus = editingItem
    ? getTrangThaiVoucher(editingItem)
    : null;
  const editingCode = editingStatus?.code ?? null;
  const editingIsOngoingLike =
    editingCode === "ONGOING" || editingCode === "OUT_OF_STOCK";
  const editingIsEnded = editingCode === "ENDED";

  const canSubmitForm = editingItem
    ? canEditVoucher(editingItem) && !editingIsEnded
    : canCreate;

  // field nào được phép sửa trong mode đang diễn ra
  const isFieldDisabled = (fieldName) => {
    if (!isAdminOrManager) return true; // các role khác chỉ xem

    // Thêm mới: admin/manager được sửa tất cả
    if (!editingItem) return false;

    // Voucher đã kết thúc: không cho sửa gì
    if (editingIsEnded) return true;

    // Đang diễn ra / hết lượt: chỉ cho sửa ngày kết thúc
    if (editingIsOngoingLike) {
      return fieldName !== "ngayKetThuc";
    }

    // Sắp diễn ra: sửa bình thường
    return false;
  };

  // ===== Lưu (Thêm / Sửa) =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmitForm) {
      alert("Bạn không có quyền lưu thay đổi cho mã giảm giá này.");
      return;
    }

    if (!formData.maCode.trim()) {
      alert("Vui lòng nhập mã code!");
      return;
    }

    if (!formData.tenMaGiamGia.trim()) {
      alert("Vui lòng nhập tên mã giảm giá!");
      return;
    }

    if (!formData.hinhThucGiam) {
      alert("Vui lòng chọn hình thức giảm!");
      return;
    }

    const type = formData.hinhThucGiam;
    const soLuong = Number(formData.soLuong) || 0;

    if (!editingItem && soLuong <= 0) {
      alert("Số lượng phải lớn hơn 0!");
      return;
    }

    if (!formData.ngayBatDau || !formData.ngayKetThuc) {
      alert("Vui lòng chọn ngày bắt đầu và ngày kết thúc!");
      return;
    }

    const dStart = new Date(formData.ngayBatDau);
    const dEnd = new Date(formData.ngayKetThuc);
    if (Number.isNaN(dStart.getTime()) || Number.isNaN(dEnd.getTime())) {
      alert("Ngày bắt đầu / kết thúc không hợp lệ!");
      return;
    }
    if (dEnd < dStart) {
      alert("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
      return;
    }

    //  (trừ khi voucher đã/đang chạy)
    const todayStr = new Date().toISOString().slice(0, 10);
    const isPastVoucher =
      editingIsOngoingLike || editingIsEnded;
    if (!isPastVoucher && formData.ngayBatDau < todayStr) {
      alert("Ngày bắt đầu không được nhỏ hơn ngày hôm nay!");
      return;
    }

    // Validate theo loáº¡i
    let soTienGiam = null;
    let phanTramGiam = null;
    let giamToiDa = null;

    if (type === "AMOUNT") {
      soTienGiam = Number(formData.soTienGiam) || 0;
      if (soTienGiam <= 0) {
        alert("Giá trị giảm (đồng) phải lớn hơn 0!");
        return;
      }
    } else if (type === "PERCENT") {
      phanTramGiam = Number(formData.phanTramGiam) || 0;
      if (phanTramGiam <= 0 || phanTramGiam > 100) {
        alert("Phần trăm giảm phải trong khoảng (0, 100]!");
        return;
      }
      if (formData.giamToiDa !== "") {
        giamToiDa = Number(formData.giamToiDa) || 0;
        if (giamToiDa <= 0) {
          alert("Giảm tối đa phải lớn hơn 0!");
          return;
        }
      }
    } else if (type === "FREESHIP") {
      giamToiDa = Number(formData.giamToiDa) || 0;
      if (giamToiDa <= 0) {
        alert("Giá trị freeship tối đa phải lớn hơn 0!");
        return;
      }
    }

    let dieuKienDonToiThieu = null;
    if (formData.dieuKienDonToiThieu !== "") {
      dieuKienDonToiThieu = Number(formData.dieuKienDonToiThieu) || 0;
      if (dieuKienDonToiThieu < 0) {
        alert("Đơn hàng tối thiểu không được âm!");
        return;
      }
    }

    const maNVForPayload =
      formData.maNhanVien || currentMaNhanVien || null;

    const payload = {
      maCode: formData.maCode.trim(),
      tenMaGiamGia: formData.tenMaGiamGia.trim(),
      moTa: formData.moTa || null,
      hinhThucGiam: type,
      soTienGiam,
      phanTramGiam,
      giamToiDa,
      dieuKienDonToiThieu,
      chiApDungSinhNhat: !!formData.chiApDungSinhNhat,
      soLuong,
      ngayBatDau: formData.ngayBatDau,
      ngayKetThuc: formData.ngayKetThuc,
      maNhanVien: maNVForPayload
        ? Number(maNVForPayload)
        : null,
    };

    // Nếu voucher đang diễn ra / hết lượt: chỉ cho cập nhật ngày kết thúc
    if (editingItem && editingIsOngoingLike) {
      payload.maCode = editingItem.maCode;
      payload.moTa = editingItem.moTa;
      payload.hinhThucGiam = editingItem.hinhThucGiam;
      payload.soTienGiam = editingItem.soTienGiam;
      payload.phanTramGiam = editingItem.phanTramGiam;
      payload.giamToiDa = editingItem.giamToiDa;
      payload.dieuKienDonToiThieu = editingItem.dieuKienDonToiThieu;
      payload.chiApDungSinhNhat = !!editingItem.chiApDungSinhNhat;
      payload.soLuong = editingItem.soLuong;
      payload.ngayBatDau = editingItem.ngayBatDau;
    }

    try {
      setSaving(true);
      if (editingItem) {
        await magiamgiaService.update(editingItem.maVoucher, payload);
        alert("Cập nhật mã giảm giá thành công!");
      } else {
        await magiamgiaService.create(payload);
        alert("Thêm mã giảm giá thành công!");
      }

      const newList = await magiamgiaService.getAll();
      setItems(Array.isArray(newList) ? newList : []);
      closeForm();
    } catch (error) {
      console.error("Lỗi khi lưu mã giảm giá:", error);
      alert(
        "Có lỗi xảy ra khi lưu mã giảm giá: " +
          (error.response?.data?.message ||
            error.message ||
            "")
      );
    } finally {
      setSaving(false);
    }
  };

  // ===== UI loading =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-700">
          Đang tải mã giảm giá…
        </div>
      </div>
    );
  }

  const isAmount = formData.hinhThucGiam === "AMOUNT";
  const isPercent = formData.hinhThucGiam === "PERCENT";
  const isFreeship = formData.hinhThucGiam === "FREESHIP";

  const todayInputMin = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/80 p-3 text-blue-600 shadow-sm">
            <Tag size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Quản lý mã giảm giá
            </h1>
            <p className="text-sm text-slate-600">
              Tạo và quản lý voucher theo 3 hình thức giảm: tiền cố
              định, phần trăm, freeship. Hỗ trợ voucher sinh nhật.
            </p>
          </div>
        </div>

        {canCreate ? (
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Thêm mã giảm giá
          </button>
        ) : (
          <span className="text-xs text-gray-500 italic">
            Bạn chỉ có quyền xem danh sách mã giảm giá
          </span>
        )}
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã code, mô tả, nhân viên, trạng thái…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="px-8 py-12 text-center text-gray-500">
            {term
              ? "Không tìm thấy mã giảm giá phù hợp"
              : "Chưa có mã giảm giá nào"}
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Mã code</th>
                <th className="px-4 py-3 text-left">Tên mã</th>
                <th className="px-4 py-3 text-left">Hình thức</th>
                <th className="px-4 py-3 text-left">Nội dung giảm</th>
                <th className="px-4 py-3 text-left">Đơn tối thiểu</th>
                <th className="px-4 py-3 text-left">Số lượng</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
                <th className="px-4 py-3 text-left">Sinh nhật</th>
                <th className="px-4 py-3 text-left">Nhân viên</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((v) => {
                const tenNV = getTenNhanVien(v.maNhanVien);
                const status = getTrangThaiVoucher(v);
                const isBirthday = v.isBirthdayOnly;

                const canEditRow = canEditVoucher(v);
                const canDeleteRow = canDeleteVoucher(v);

                return (
                  <tr
                    key={v.maVoucher}
                    className="hover:bg-gray-50/80"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {v.maCode}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {v.tenMaGiamGia || ""}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {v.typeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {getDiscountSummary(v)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {v.dieuKienDonToiThieu != null &&
                      v.dieuKienDonToiThieu > 0
                        ? fmtCurrency(v.dieuKienDonToiThieu)
                        : "Không"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="text-xs">
                        <div>
                          Tổng:{" "}
                          <span className="font-semibold">
                            {v.soLuong}
                          </span>
                        </div>
                        <div>
                          Đã dùng:{" "}
                          <span className="font-semibold">
                            {v.soLuongDaDung ?? 0}
                          </span>
                        </div>
                        <div>
                          Còn lại:{" "}
                          <span className="font-semibold text-blue-700">
                            {v.soLuongConLai}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="text-xs">
                        <div>
                          Từ:{" "}
                          <span className="font-medium">
                            {fmtDate(v.ngayBatDau)}
                          </span>
                        </div>
                        <div>
                          Đến:{" "}
                          <span className="font-medium">
                            {fmtDate(v.ngayKetThuc)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {isBirthday ? (
                        <span className="inline-flex items-center rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700">
                          🎂 Voucher sinh nhật
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Không
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {tenNV}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {isAdminOrManager ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditForm(v)}
                            disabled={!canEditRow}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                              canEditRow
                                ? "border-blue-200 text-blue-600 hover:border-blue-400 hover:text-blue-700"
                                : "cursor-not-allowed border-gray-200 text-gray-400"
                            }`}
                          >
                            <Edit size={14} />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            disabled={!canDeleteRow}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                              canDeleteRow
                                ? "border-red-200 text-red-600 hover:border-red-400 hover:text-red-700"
                                : "cursor-not-allowed border-gray-200 text-gray-400"
                            }`}
                          >
                            <Trash2 size={14} />
                            Xoá
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Chỉ xem
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Thêm / Sửa */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  {editingItem
                    ? "Cập nhật mã giảm giá"
                    : "Thêm mã giảm giá mới"}
                </p>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingItem
                    ? formData.maCode
                    : "Thông tin mã giảm giá"}
                </h3>
              </div>
              <button
                onClick={closeForm}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(90vh-4rem)] space-y-4 overflow-y-auto px-6 py-5"
            >
              {/* MÃ£ & mÃ´ táº£ */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Mã code <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formData.maCode}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        maCode: e.target.value,
                      }))
                    }
                    placeholder="VD: SALE50"
                    disabled={isFieldDisabled("maCode")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tên mã giảm giá <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formData.tenMaGiamGia}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        tenMaGiamGia: e.target.value,
                      }))
                    }
                    placeholder="VD: Freeship 50k"
                    disabled={isFieldDisabled("tenMaGiamGia")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nhân viên tạo mã
                  </label>
                  <input
                    type="text"
                    value={
                      currentTenNhanVien ||
                      getTenNhanVien(formData.maNhanVien) ||
                      "Không xác định"
                    }
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Mô tả
                </label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      moTa: e.target.value,
                    }))
                  }
                  placeholder="VD: Giảm 50.000 cho đơn từ 500.000"
                  rows={3}
                  disabled={isFieldDisabled("moTa")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              {/* Hình thức giảm giá */}
              <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                <label className="block text-sm font-semibold text-blue-900">
                  Hình thức giảm giá{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      !isFieldDisabled("hinhThucGiam") &&
                      setFormData((f) => ({
                        ...f,
                        hinhThucGiam: "AMOUNT",
                      }))
                    }
                    className={`flex-1 min-w-[110px] rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      isAmount
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-blue-100 bg-white text-blue-700 hover:border-blue-300"
                    } ${
                      isFieldDisabled("hinhThucGiam")
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                    disabled={isFieldDisabled("hinhThucGiam")}
                  >
                    Giảm tiền cố định
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      !isFieldDisabled("hinhThucGiam") &&
                      setFormData((f) => ({
                        ...f,
                        hinhThucGiam: "PERCENT",
                      }))
                    }
                    className={`flex-1 min-w-[110px] rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      isPercent
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-blue-100 bg-white text-blue-700 hover:border-blue-300"
                    } ${
                      isFieldDisabled("hinhThucGiam")
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                    disabled={isFieldDisabled("hinhThucGiam")}
                  >
                    Giảm %
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      !isFieldDisabled("hinhThucGiam") &&
                      setFormData((f) => ({
                        ...f,
                        hinhThucGiam: "FREESHIP",
                      }))
                    }
                    className={`flex-1 min-w-[110px] rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      isFreeship
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-blue-100 bg-white text-blue-700 hover:border-blue-300"
                    } ${
                      isFieldDisabled("hinhThucGiam")
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                    disabled={isFieldDisabled("hinhThucGiam")}
                  >
                    Freeship
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {isAmount && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Số tiền giảm (VND){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.soTienGiam}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            soTienGiam: e.target.value,
                          }))
                        }
                        disabled={isFieldDisabled("soTienGiam")}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  )}

                  {isPercent && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Phần trăm giảm (%){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.phanTramGiam}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              phanTramGiam: e.target.value,
                            }))
                          }
                          disabled={isFieldDisabled("phanTramGiam")}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Giảm tối đa (VND)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.giamToiDa}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              giamToiDa: e.target.value,
                            }))
                          }
                          disabled={isFieldDisabled("giamToiDa")}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </div>
                    </>
                  )}

                  {isFreeship && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Giá trị freeship tối đa (VND){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.giamToiDa}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            giamToiDa: e.target.value,
                          }))
                        }
                        disabled={isFieldDisabled("giamToiDa")}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Đơn hàng tối thiểu (VND)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.dieuKienDonToiThieu}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          dieuKienDonToiThieu: e.target.value,
                        }))
                      }
                      disabled={isFieldDisabled("dieuKienDonToiThieu")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Để trống nếu không yêu cầu giá trị tối thiểu.
                    </p>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-blue-900">
                  <input
                    type="checkbox"
                    checked={formData.chiApDungSinhNhat}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        chiApDungSinhNhat: e.target.checked,
                      }))
                    }
                    disabled={isFieldDisabled("chiApDungSinhNhat")}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <span>Chỉ áp dụng trong tháng sinh nhật khách hàng</span>
                </label>
              </div>

              {/* Số lượng & thời gian */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.soLuong}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        soLuong: e.target.value,
                      }))
                    }
                    disabled={isFieldDisabled("soLuong")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.ngayBatDau}
                    min={todayInputMin}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        ngayBatDau: e.target.value,
                      }))
                    }
                    disabled={isFieldDisabled("ngayBatDau")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.ngayKetThuc}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        ngayKetThuc: e.target.value,
                      }))
                    }
                    disabled={isFieldDisabled("ngayKetThuc")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || !canSubmitForm}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
