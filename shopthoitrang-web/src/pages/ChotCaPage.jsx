// src/pages/ChotCaPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  DollarSign,
  Receipt,
  CreditCard,
  Calculator,
  Send,
  FileText,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import chotcaService from "../services/chotcaService";
import donhangService from "../services/donhangService";
import nhanvienService from "../services/nhanvienService";
import trahangService from "../services/trahangService";

const formatCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { hour12: false }) : "-";

const StatusBadge = ({ status }) => {
  const colors = {
    "Tạo mới": "bg-blue-100 text-blue-700 border-blue-200",
    "Chờ xác nhận": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Chờ duyệt": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Đã duyệt": "bg-green-100 text-green-700 border-green-200",
    "Từ chối": "bg-red-100 text-red-700 border-red-200",
  };
  const cls = colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium border ${cls}`}
    >
      {status}
    </span>
  );
};

export default function ChotCaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isManager = ["ADMIN", "MANAGER"].includes(user?.maQuyen);
  const isEmployee = !isManager && !!user?.maNhanVien;

  const [filters, setFilters] = useState({
    ngayChotCa: "",
    trangThai: "",
    maNhanVien: "",
  });
  const [chotCaList, setChotCaList] = useState([]);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    maNhanVien: "",
    ngayChotCa: new Date().toISOString().split("T")[0],
    ghiChu: "",
  });

  const [reportData, setReportData] = useState({
    donHangList: [],
    refundList: [],
    tongThu: 0,
    tienMat: 0,
    tienChi: 0,
    tienChiTienMat: 0,
    tienChiChuyenKhoan: 0,
    tienChuyenKhoan: 0,
    soLuongDonHang: 0,
    chenhLechTienMat: 0,
  });
  const [tienMatThucTe, setTienMatThucTe] = useState("");
  const [tienChiThucTe, setTienChiThucTe] = useState("");

  function getNhanVienName(maNhanVien) {
    if (maNhanVien && user?.maNhanVien === maNhanVien && user?.hoTen)
      return user.hoTen;
    const nv = nhanVienList.find((n) => n.maNhanVien === maNhanVien);
    return nv ? nv.hoTen : maNhanVien ? `Nhân viên #${maNhanVien}` : "-";
  }

  async function loadNhanVien() {
    try {
      const data = await nhanvienService.getAll();
      setNhanVienList(data || []);
    } catch (e) {
      console.error("Lỗi tải danh sách nhân viên:", e);
    }
  }

  async function loadData(overrideFilters) {
    try {
      setLoading(true);
      const f = overrideFilters ?? filters;
      const params = {};
      if (isEmployee) params.manhanvien = user.maNhanVien;
      if (isManager && f.maNhanVien) params.manhanvien = f.maNhanVien;
      if (f.ngayChotCa) params.ngaychotca = f.ngayChotCa;
      if (f.trangThai) params.trangthai = f.trangThai;
      const data = await chotcaService.getAll(params);
      setChotCaList(data || []);
    } catch (e) {
      console.error("Lỗi tải dữ liệu chốt ca:", e);
      alert("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    setFilters((prev) => ({
      ...prev,
      maNhanVien: isEmployee ? user.maNhanVien : "",
    }));
    loadNhanVien();
    loadData({
      ...filters,
      maNhanVien: isEmployee ? user.maNhanVien : filters.maNhanVien,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isEmployee, isManager]);

  function handleOpenModal() {
    setShowModal(true);
    setStep(1);
    setFormData({
      maNhanVien: isEmployee ? user.maNhanVien : "",
      ngayChotCa: new Date().toISOString().split("T")[0],
      ghiChu: "",
    });
    setReportData({
      donHangList: [],
      refundList: [],
      tongThu: 0,
      tienMat: 0,
      tienChi: 0,
      tienChiTienMat: 0,
      tienChiChuyenKhoan: 0,
      tienChuyenKhoan: 0,
      soLuongDonHang: 0,
      chenhLechTienMat: 0,
    });
    setTienMatThucTe("");
    setTienChiThucTe("");
  }
  function handleCloseModal() {
    setShowModal(false);
    setStep(1);
  }

  async function handleApplyFilters() {
    setCurrentPage(1);
    await loadData(filters);
  }

  // ==========================
  // HÀM TẠO BÁO CÁO CHỐT CA
  // ==========================
  async function generateReport() {
    const selectedMaNhanVien = isEmployee
      ? user.maNhanVien
      : formData.maNhanVien;
    if (!selectedMaNhanVien) {
      alert("Vui lòng chọn nhân viên");
      return;
    }
    if (!formData.ngayChotCa) {
      alert("Vui lòng nhập ngày chốt ca");
      return;
    }

    try {
      setLoading(true);

      // Frontend guard: không cho tạo trùng chốt ca theo nhân viên + ngày
      const existed = await chotcaService.getAll({
        manhanvien: selectedMaNhanVien,
        ngaychotca: formData.ngayChotCa,
      });
      const hasActive = (existed || []).some((it) => {
        const st = String(it.trangThai || "").toLowerCase().trim();
        // Cho phép tạo lại nếu chốt ca đã bị hủy hoặc từ chối
        const isCancelledOrRejected =
          st.includes("hủy") || st.includes("huỷ") || st.includes("từ chối");
        return !isCancelledOrRejected;
      });
      if (hasActive) {
        alert(
          "Mỗi nhân viên chỉ chốt ca 1 lần/ngày. Chốt ca bị từ chối hoặc hủy thì có thể tạo lại."
        );
        setLoading(false);
        return;
      }

      const selectedDate = formData.ngayChotCa; // YYYY-MM-DD

      // ==========================
      // 1) LẤY ĐƠN HÀNG (chỉ POS)
      // ==========================
      const allOrders = await donhangService.getAll({
        manhanvien: selectedMaNhanVien,
        // chỉ đơn tại quầy POS
        nguon_don: "POS",
        nguonDon: "POS",
      });

      const ordersOnSelectedDate = (allOrders || []).filter((order) => {
        if (!order.ngayDatHang) return false;
        const orderDate = String(order.ngayDatHang).split("T")[0];
        return orderDate === selectedDate;
      });

      const validStatuses = [
        "Đã duyệt",
        "Đang giao",
        "Đã giao",
        "Đủ điều kiện hoàn tiền",
      ];

      const validOrders = ordersOnSelectedDate.filter((o) =>
        validStatuses.includes(o.trangThaiDonHang)
      );

      let tienMat = 0,
        tienChuyenKhoan = 0;
      validOrders.forEach((o) => {
        const thanhTien = o.thanhTien || 0;
        if (o.phuongThucThanhToan === "Tiền mặt") tienMat += thanhTien;
        else if (
          o.phuongThucThanhToan === "Bank" ||
          o.phuongThucThanhToan === "Chuyển khoản"
        )
          tienChuyenKhoan += thanhTien;
      });

      // ===========================================
      // 2) LẤY ĐƠN TRẢ HÀNG (chỉ POS / nguon_tao=POS)
      // ===========================================
      let tienChi = 0;
      let tienChiTienMat = 0;
      let tienChiChuyenKhoan = 0;
      let refundList = [];

      try {
        const allRefunds = await trahangService.getAll({
          manhanvien: selectedMaNhanVien,
          nguon_tao: "POS",
          nguonTao: "POS",
        });
        console.log("[ChotCa] All refunds for employee:", allRefunds);

        const refundsOnSelectedDate = (allRefunds || []).filter((refund) => {
          // chọn ngày: ưu tiên ngayHoanTien, fallback ngayDuyet
          const dateToCheck = refund.ngayHoanTien || refund.ngayDuyet;
          if (!dateToCheck) return false;

          const refundDate = String(dateToCheck).split("T")[0];
          const isMatchDate = refundDate === selectedDate;

          const statusNorm = String(refund.trangThai || "")
            .toUpperCase()
            .replace(/\s+/g, "_");
          const isCompleted =
            statusNorm.includes("HOAN_TIEN") ||
            statusNorm.includes("HOÀN_TIỀN") ||
            statusNorm.includes("DA_DUYET") ||
            statusNorm.includes("ĐÃ_DUYỆT");

          const amount = Number(refund.soTienHoan) || 0;
          return isMatchDate && isCompleted && amount > 0;
        });

        // Tính tổng chi theo từng phương thức
        refundsOnSelectedDate.forEach((refund) => {
          const amount = Number(refund.soTienHoan) || 0;
          const methodRaw =
            refund.phuongThucHoan ||
            refund.phuongthuc_hoan ||
            refund.phuongthuc ||
            refund.phuongThuc ||
            "";
          const method = String(methodRaw).toLowerCase();

          if (
            method.includes("tiền mặt") ||
            method.includes("tien mat") ||
            method.includes("cash")
          ) {
            tienChiTienMat += amount;
          } else if (
            method.includes("chuyển khoản") ||
            method.includes("chuyen khoan") ||
            method.includes("bank")
          ) {
            tienChiChuyenKhoan += amount;
          }

          tienChi += amount;
        });

        refundList = refundsOnSelectedDate;
      } catch (refundErr) {
        console.log("[ChotCa] Error loading refunds:", refundErr);
      }

      // =====================
      // 3) TÍNH TỔNG & SET STATE
      // =====================
      const tongThu =
        (tienMat - tienChiTienMat) +
        (tienChuyenKhoan - tienChiChuyenKhoan);

      setReportData({
        donHangList: validOrders,
        refundList: refundList,
        tongThu,
        tienMat,
        tienChi,
        tienChiTienMat,
        tienChiChuyenKhoan,
        tienChuyenKhoan,
        soLuongDonHang: validOrders.length,
        chenhLechTienMat: 0,
      });
      setStep(2);
    } catch (e) {
      console.error("Lỗi tạo báo cáo:", e);
      alert("Có lỗi xảy ra khi tạo báo cáo");
    } finally {
      setLoading(false);
    }
  }

  function handleTienMatChange(value) {
    const tienMatSo = parseFloat(value) || 0;
    setTienMatThucTe(value);
    const tienMatHeThong = reportData.tienMat - reportData.tienChiTienMat;
    const chenhLech = tienMatSo - tienMatHeThong;
    setReportData((prev) => ({ ...prev, chenhLechTienMat: chenhLech }));
  }

  async function handleSubmitChotCa() {
    const selectedMaNhanVien = isEmployee
      ? user.maNhanVien
      : formData.maNhanVien;
    if (!tienMatThucTe) {
      alert("Vui lòng nhập tiền mặt thực tế");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        maNhanVien: selectedMaNhanVien,
        ngayChotCa: formData.ngayChotCa,
        tongThu: reportData.tongThu,
        tienMat: reportData.tienMat,
        tienChi: reportData.tienChi,
        tienChuyenKhoan: reportData.tienChuyenKhoan,
        soLuongDonHang: reportData.soLuongDonHang,
        chenhLechTienMat: reportData.chenhLechTienMat,
        ghiChu: formData.ghiChu,
        trangThai: "Chờ duyệt",
      };
      await chotcaService.create(payload);
      alert("Đã gửi báo cáo chốt ca thành công!");
      handleCloseModal();
      loadData();
    } catch (e) {
      console.error("Lỗi gửi báo cáo:", e);
      alert(
        `Có lỗi xảy ra khi gửi báo cáo: ${
          e.response?.data?.message || e.message
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  // Summary counts
  const counts = chotCaList.reduce((acc, cur) => {
    const k = cur.trangThai || "Chờ duyệt";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  // Net values theo hệ thống
  const netTienMat = reportData.tienMat - reportData.tienChiTienMat;
  const netTienChuyenKhoan =
    reportData.tienChuyenKhoan - reportData.tienChiChuyenKhoan;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chốt Ca</h1>
          <p className="text-gray-600">
            {isEmployee
              ? "Quản lý báo cáo chốt ca của bạn"
              : "Quản lý báo cáo chốt ca của tất cả nhân viên"}
          </p>
        </div>
        {(isEmployee || isManager) &&
          (() => {
            const todayStr = new Date().toISOString().split("T")[0];
            const hasChotCaToday =
              isEmployee &&
              chotCaList.some((it) => {
                const dateStr = it.ngayChotCa
                  ? new Date(it.ngayChotCa).toISOString().split("T")[0]
                  : "";
                const st = String(it.trangThai || "").toLowerCase().trim();
                const isCancelledOrRejected =
                  st.includes("hủy") ||
                  st.includes("huỷ") ||
                  st.includes("từ chối");
                const isActive = !isCancelledOrRejected;
                return (
                  it.maNhanVien === user.maNhanVien &&
                  dateStr === todayStr &&
                  isActive
                );
              });
            return (
              <button
                onClick={handleOpenModal}
                disabled={!!hasChotCaToday}
                title={
                  hasChotCaToday
                    ? "Bạn đã chốt ca hôm nay. Nếu bị từ chối, hãy tạo lại."
                    : ""
                }
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
                  hasChotCaToday
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <Plus size={20} />
                {isEmployee
                  ? hasChotCaToday
                    ? "Đã chốt ca hôm nay"
                    : "Chốt ca"
                  : "Tạo chốt ca"}
              </button>
            );
          })()}
      </div>

      {/* Summary blocks before filters */}
      {chotCaList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: "Chờ duyệt",
              color: "bg-yellow-50 text-yellow-700",
              count: counts["Chờ duyệt"] || 0,
            },
            {
              label: "Đã duyệt",
              color: "bg-green-50 text-green-700",
              count: counts["Đã duyệt"] || 0,
            },
            {
              label: "Từ chối",
              color: "bg-red-50 text-red-700",
              count: counts["Từ chối"] || 0,
            },
          ].map((it) => (
            <div
              key={it.label}
              className={`${it.color} border rounded-lg p-4`}
            >
              <div className="text-sm font-medium">{it.label}</div>
              <div className="text-2xl font-bold">{it.count}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters (compact) */}
      <div className="bg-white p-3 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày chốt ca
            </label>
            <input
              type="date"
              value={filters.ngayChotCa}
              onChange={(e) =>
                setFilters((s) => ({ ...s, ngayChotCa: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.trangThai}
              onChange={(e) =>
                setFilters((s) => ({ ...s, trangThai: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="Chờ duyệt">Chờ duyệt</option>
              <option value="Đã duyệt">Đã duyệt</option>
              <option value="Từ chối">Từ chối</option>
            </select>
          </div>
          {isManager && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhân viên
              </label>
              <select
                value={filters.maNhanVien}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, maNhanVien: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              >
                <option value="">Tất cả nhân viên</option>
                {nhanVienList.map((nv) => (
                  <option key={nv.maNhanVien} value={nv.maNhanVien}>
                    {nv.hoTen}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Lọc
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày chốt ca
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng thu
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số đơn hàng
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      <span className="ml-2">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : chotCaList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <FileText
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <p>Chưa có báo cáo chốt ca nào</p>
                    {(isEmployee || isManager) && (
                      <button
                        onClick={handleOpenModal}
                        className="mt-2 text-blue-600 hover:underline"
                      >
                        {isEmployee
                          ? "Chốt ca ngay"
                          : "Tạo chốt ca đầu tiên"}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (() => {
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentItems = chotCaList.slice(
                    indexOfFirstItem,
                    indexOfLastItem
                  );
                  return currentItems.map((item) => (
                    <tr key={item.maChotCa || item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.ngayChotCa
                          ? new Date(item.ngayChotCa).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getNhanVienName(item.maNhanVien)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(item.tongThu)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.soLuongDonHang || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={item.trangThai || "Chờ duyệt"} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() =>
                              navigate(`/chotca/${item.maChotCa}`)
                            }
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {chotCaList.length > itemsPerPage && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  chotCaList.length
                )}{" "}
                -{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  chotCaList.length
                )}{" "}
                trong tổng số {chotCaList.length} bản ghi
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                {(() => {
                  const totalPages = Math.ceil(
                    chotCaList.length / itemsPerPage
                  );
                  const pages = [];
                  for (let i = 1; i <= totalPages; i++) {
                    if (
                      i === 1 ||
                      i === totalPages ||
                      (i >= currentPage - 1 && i <= currentPage + 1)
                    ) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-1 border rounded-lg text-sm ${
                            currentPage === i
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {i}
                        </button>
                      );
                    } else if (i === currentPage - 2 || i === currentPage + 2) {
                      pages.push(
                        <span key={i} className="px-2">
                          ...
                        </span>
                      );
                    }
                  }
                  return pages;
                })()}
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        prev + 1,
                        Math.ceil(chotCaList.length / itemsPerPage)
                      )
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(chotCaList.length / itemsPerPage)
                  }
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Tạo báo cáo chốt ca - Bước {step}/2
              </h3>
            </div>

            <div className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-4">
                    Thông tin chốt ca
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isManager && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chọn nhân viên <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.maNhanVien}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maNhanVien: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">-- Chọn nhân viên --</option>
                          {nhanVienList.map((nv) => (
                            <option
                              key={nv.maNhanVien}
                              value={nv.maNhanVien}
                            >
                              {nv.hoTen}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {isEmployee && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nhân viên chốt ca
                        </label>
                        <input
                          type="text"
                          disabled
                          value={
                            user.hoTen || `Nhân viên #${user.maNhanVien}`
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày chốt ca <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.ngayChotCa}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ngayChotCa: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ghi chú
                      </label>
                      <input
                        type="text"
                        value={formData.ghiChu}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ghiChu: e.target.value,
                          })
                        }
                        placeholder="Ghi chú về ca làm việc..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h4 className="font-medium text-gray-900">
                    Báo cáo tự động được tạo
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">
                            Tổng thu
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(reportData.tongThu)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Receipt className="h-8 w-8 text-red-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-600">
                            Tổng chi
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(reportData.tienChi)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-500">
                      <div className="flex items-center">
                        <Receipt className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">
                            Tiền mặt (net)
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(netTienMat)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CreditCard className="h-8 w-8 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-600">
                            Chuyển khoản (net)
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(netTienChuyenKhoan)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-orange-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-orange-600">
                            Số đơn hàng
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {reportData.soLuongDonHang}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border space-y-3">
                    <h5 className="font-medium text-gray-900 text-sm">
                      Kiểm toán tiền mặt
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tiền mặt theo hệ thống
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(netTienMat)}
                          disabled
                          className="w-full border border-gray-300 rounded px-2 py-1.5 bg-gray-50 text-sm font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-red-600 mb-1">
                          Tiền mặt thực tế đếm được{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={tienMatThucTe}
                          onChange={(e) =>
                            handleTienMatChange(e.target.value)
                          }
                          placeholder="Nhập số tiền đếm được"
                          className="w-full border-2 border-blue-400 rounded px-2 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Chênh lệch
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(
                            reportData.chenhLechTienMat
                          )}
                          disabled
                          className={`w-full border rounded px-2 py-1.5 text-sm font-semibold ${
                            reportData.chenhLechTienMat > 0
                              ? "bg-green-50 border-green-400 text-green-700"
                              : reportData.chenhLechTienMat < 0
                              ? "bg-red-50 border-red-400 text-red-700"
                              : "bg-gray-50 border-gray-300"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bảng đơn trả hàng */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3 text-sm">
                      Đơn trả hàng đã hoàn tiền
                    </h5>
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Mã đơn hàng
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Ngày hoàn tiền
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Phương thức thanh toán
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Số tiền hoàn
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(reportData.refundList || []).length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-3 py-8 text-center text-gray-500 text-xs"
                              >
                                Không có đơn trả hàng nào trong ca này
                              </td>
                            </tr>
                          ) : (
                            (reportData.refundList || []).map((refund) => {
                              const methodRaw =
                                refund.phuongThucHoan ||
                                refund.phuongthuc_hoan ||
                                refund.phuongthuc ||
                                refund.phuongThuc ||
                                "Tiền mặt";
                              const methodLower =
                                String(methodRaw).toLowerCase();
                              const isCash =
                                methodLower.includes("tiền mặt") ||
                                methodLower.includes("tien mat") ||
                                methodLower.includes("cash");
                              return (
                                <tr
                                  key={refund.maTraHang}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-3 py-2 text-xs text-gray-900">
                                    {refund.maDonHang}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-gray-900">
                                    {refund.ngayHoanTien
                                      ? formatDateTime(
                                          refund.ngayHoanTien
                                        )
                                      : refund.ngayDuyet
                                      ? formatDateTime(
                                          refund.ngayDuyet
                                        )
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-gray-900">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        isCash
                                          ? "bg-green-100 text-green-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {methodRaw}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-xs text-red-600 text-right font-medium">
                                    {formatCurrency(refund.soTienHoan)}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        {(reportData.refundList || []).length > 0 && (
                          <tfoot className="bg-gray-50 border-t">
                            <tr>
                              <td
                                colSpan={3}
                                className="px-3 py-2 text-xs font-semibold text-gray-700"
                              >
                                Tổng cộng:{" "}
                                {(reportData.refundList || []).length} đơn
                              </td>
                              <td className="px-3 py-2 text-xs font-bold text-red-700 text-right">
                                {formatCurrency(
                                  (reportData.refundList || []).reduce(
                                    (sum, r) =>
                                      sum + (r.soTienHoan || 0),
                                    0
                                  )
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">
                      Chi tiết đơn hàng ({reportData.donHangList.length} đơn)
                    </h5>
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Mã đơn
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Thời gian
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Phương thức thanh toán
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Thành tiền
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.donHangList.map((order) => (
                            <tr key={order.maDonHang}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {order.maDonHang}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {formatDateTime(order.ngayDatHang)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    order.phuongThucThanhToan ===
                                    "Tiền mặt"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {order.phuongThucThanhToan}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                                {formatCurrency(order.thanhTien)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Hủy
              </button>
              <div className="flex gap-2">
                {step === 2 && (
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Quay lại
                  </button>
                )}
                {step === 1 && (
                  <button
                    onClick={generateReport}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Calculator size={16} />
                    {loading ? "Đang tạo..." : "Tạo báo cáo"}
                  </button>
                )}
                {step === 2 && (
                  <button
                    onClick={handleSubmitChotCa}
                    disabled={loading || !tienMatThucTe}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Send size={16} />
                    {loading ? "Đang gửi..." : "Gửi cho quản lý"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
