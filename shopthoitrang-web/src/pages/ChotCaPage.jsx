// src/pages/ChotCaPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, DollarSign, Receipt, CreditCard, Calculator, Send, FileText } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import chotcaService from "../services/chotcaService";
import donhangService from "../services/donhangService";
import nhanvienService from "../services/nhanvienService";

const formatCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("vi-VN", { hour12: false })
    : "-";

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
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${cls}`}>
      {status}
    </span>
  );
};

export default function ChotCaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isManager = ["ADMIN", "MANAGER"].includes(user?.maQuyen);
  const isEmployee = !isManager && !!user?.maNhanVien;

  const [filters, setFilters] = useState({ ngayChotCa: "", trangThai: "", maNhanVien: "" });
  const [chotCaList, setChotCaList] = useState([]);
  const [nhanVienList, setNhanVienList] = useState([]);

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
    tongThu: 0,
    tienMat: 0,
    tienChi: 0,
    tienChuyenKhoan: 0,
    soLuongDonHang: 0,
    chenhLechTienMat: 0,
  });
  const [tienMatThucTe, setTienMatThucTe] = useState("");
  const [tienChiThucTe, setTienChiThucTe] = useState("");

  function getNhanVienName(maNhanVien) {
    if (maNhanVien && user?.maNhanVien === maNhanVien && user?.hoTen) return user.hoTen;
    const nv = nhanVienList.find((n) => n.maNhanVien === maNhanVien);
    return nv ? nv.hoTen : (maNhanVien ? `Nhân viên #${maNhanVien}` : "-");
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
    setFilters((prev) => ({ ...prev, maNhanVien: isEmployee ? user.maNhanVien : "" }));
    loadNhanVien();
    loadData({ ...filters, maNhanVien: isEmployee ? user.maNhanVien : filters.maNhanVien });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isEmployee, isManager]);

  function handleOpenModal() {
    setShowModal(true);
    setStep(1);
    setFormData({ maNhanVien: isEmployee ? user.maNhanVien : "", ngayChotCa: new Date().toISOString().split("T")[0], ghiChu: "" });
    setReportData({ donHangList: [], tongThu: 0, tienMat: 0, tienChi: 0, tienChuyenKhoan: 0, soLuongDonHang: 0, chenhLechTienMat: 0 });
    setTienMatThucTe("");
    setTienChiThucTe("");
  }
  function handleCloseModal() { setShowModal(false); setStep(1); }

  async function handleApplyFilters() { await loadData(filters); }

  async function generateReport() {
    const selectedMaNhanVien = isEmployee ? user.maNhanVien : formData.maNhanVien;
    if (!selectedMaNhanVien) { alert("Vui lòng chọn nhân viên"); return; }
    if (!formData.ngayChotCa) { alert("Vui lòng nhập ngày chốt ca"); return; }
    try {
      setLoading(true);
      // Frontend guard: không cho tạo trùng chốt ca theo nhân viên + ngày
      const existed = await chotcaService.getAll({ manhanvien: selectedMaNhanVien, ngaychotca: formData.ngayChotCa });
      const hasActive = (existed || []).some((it) => {
        const st = (it.trangThai || '').toLowerCase();
        return st !== 'đã hủy' && st !== 'đã huỷ' && st !== 'hủy' && st !== 'huỷ';
      });
      if (hasActive) {
        alert('Mỗi nhân viên chỉ chốt ca 1 lần/ngày. Vui lòng liên hệ quản lý để hủy bản cũ trước khi tạo lại.');
        setLoading(false);
        return;
      }
      const allOrders = await donhangService.getAll({ manhanvien: selectedMaNhanVien });
      const selectedDate = formData.ngayChotCa; // YYYY-MM-DD
      const ordersOnSelectedDate = (allOrders || []).filter((order) => {
        if (!order.ngayDatHang) return false;
        const orderDate = String(order.ngayDatHang).split("T")[0];
        return orderDate === selectedDate;
      });
      const validOrders = ordersOnSelectedDate.filter((o) => ["Đã duyệt", "Đang giao", "Đã giao"].includes(o.trangThaiDonHang));
      let tongThu = 0, tienMat = 0, tienChuyenKhoan = 0;
      validOrders.forEach((o) => {
        const thanhTien = o.thanhTien || 0;
        tongThu += thanhTien;
        if (o.phuongThucThanhToan === "Tiền mặt") tienMat += thanhTien;
        else if (o.phuongThucThanhToan === "Bank") tienChuyenKhoan += thanhTien;
      });
      setReportData({
        donHangList: validOrders,
        tongThu,
        tienMat,
        tienChi: 0,
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
    const chenhLech = tienMatSo - reportData.tienMat;
    setReportData((prev) => ({ ...prev, chenhLechTienMat: chenhLech }));
  }
  function handleTienChiChange(value) {
    const tienChiSo = parseFloat(value) || 0;
    setTienChiThucTe(value);
    setReportData((prev) => ({ ...prev, tienChi: tienChiSo }));
  }

  async function handleSubmitChotCa() {
    const selectedMaNhanVien = isEmployee ? user.maNhanVien : formData.maNhanVien;
    if (!tienMatThucTe) { alert("Vui lòng nhập tiền mặt thực tế"); return; }
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
      alert(`Có lỗi xảy ra khi gửi báo cáo: ${e.response?.data?.message || e.message}`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chốt Ca</h1>
          <p className="text-gray-600">
            {isEmployee ? "Quản lý báo cáo chốt ca của bạn" : "Quản lý báo cáo chốt ca của tất cả nhân viên"}
          </p>
        </div>
        {(isEmployee || isManager) && (() => {
          const todayStr = new Date().toISOString().split('T')[0];
          const hasChotCaToday = isEmployee && chotCaList.some((it) => {
            const dateStr = it.ngayChotCa ? new Date(it.ngayChotCa).toISOString().split('T')[0] : '';
            const st = (it.trangThai || '').toLowerCase();
            const notCancelled = st !== 'đã hủy' && st !== 'đã huỷ' && st !== 'hủy' && st !== 'huỷ';
            return it.maNhanVien === user.maNhanVien && dateStr === todayStr && notCancelled;
          });
          return (
            <button
              onClick={handleOpenModal}
              disabled={!!hasChotCaToday}
              title={hasChotCaToday ? 'Bạn đã chốt ca hôm nay. Liên hệ quản lý để hủy nếu cần tạo lại.' : ''}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${hasChotCaToday ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
            <Plus size={20} />
            {isEmployee ? (hasChotCaToday ? 'Đã chốt ca hôm nay' : 'Chốt ca') : 'Tạo chốt ca'}
            </button>
          );
        })()}
      </div>

      {/* Summary blocks before filters */}
      {chotCaList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[{
            label: "Chờ duyệt", color: "bg-yellow-50 text-yellow-700", count: counts["Chờ duyệt"] || 0
          }, {
            label: "Đã duyệt", color: "bg-green-50 text-green-700", count: counts["Đã duyệt"] || 0
          }, {
            label: "Từ chối", color: "bg-red-50 text-red-700", count: counts["Từ chối"] || 0
          }, {
            label: "Chờ xác nhận", color: "bg-blue-50 text-blue-700", count: counts["Chờ xác nhận"] || 0
          }].map((it) => (
            <div key={it.label} className={`${it.color} border rounded-lg p-4`}>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày chốt ca</label>
            <input type="date" value={filters.ngayChotCa} onChange={(e) => setFilters((s) => ({ ...s, ngayChotCa: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select value={filters.trangThai} onChange={(e) => setFilters((s) => ({ ...s, trangThai: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
              <option value="">Tất cả</option>
              <option value="Chờ duyệt">Chờ duyệt</option>
              <option value="Đã duyệt">Đã duyệt</option>
              <option value="Từ chối">Từ chối</option>
            </select>
          </div>
          {isManager && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
              <select value={filters.maNhanVien} onChange={(e) => setFilters((s) => ({ ...s, maNhanVien: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                <option value="">Tất cả nhân viên</option>
                {nhanVienList.map((nv) => (
                  <option key={nv.maNhanVien} value={nv.maNhanVien}>{nv.hoTen}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button onClick={handleApplyFilters} className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700">Lọc</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày chốt ca</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng thu</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số đơn hàng</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      <span className="ml-2">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : chotCaList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <p>Chưa có báo cáo chốt ca nào</p>
                    {(isEmployee || isManager) && (
                      <button onClick={handleOpenModal} className="mt-2 text-blue-600 hover:underline">
                        {isEmployee ? "Chốt ca ngay" : "Tạo chốt ca đầu tiên"}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                chotCaList.map((item) => (
                  <tr key={item.maChotCa || item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.ngayChotCa ? new Date(item.ngayChotCa).toLocaleDateString("vi-VN") : "-"}
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
                        <button onClick={() => navigate(`/chotca/${item.maChotCa}`)} className="text-blue-600 hover:text-blue-900" title="Xem chi tiết">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Tạo báo cáo chốt ca - Bước {step}/2</h3>
            </div>

            <div className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-4">Thông tin chốt ca</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isManager && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn nhân viên <span className="text-red-500">*</span></label>
                        <select value={formData.maNhanVien} onChange={(e) => setFormData({ ...formData, maNhanVien: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                          <option value="">-- Chọn nhân viên --</option>
                          {nhanVienList.map((nv) => (
                            <option key={nv.maNhanVien} value={nv.maNhanVien}>{nv.hoTen}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {isEmployee && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên chốt ca</label>
                        <input type="text" disabled value={user.hoTen || `Nhân viên #${user.maNhanVien}`} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100" />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày chốt ca <span className="text-red-500">*</span></label>
                      <input type="date" value={formData.ngayChotCa} onChange={(e) => setFormData({ ...formData, ngayChotCa: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                      <input type="text" value={formData.ghiChu} onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })} placeholder="Ghi chú về ca làm việc..." className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h4 className="font-medium text-gray-900">Báo cáo tự động được tạo</h4>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">Tổng thu</p>
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(reportData.tongThu)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Receipt className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">Tiền mặt</p>
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(reportData.tienMat)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Receipt className="h-8 w-8 text-red-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-600">Tiền chi</p>
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(reportData.tienChi)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CreditCard className="h-8 w-8 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-600">Chuyển khoản</p>
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(reportData.tienChuyenKhoan)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-orange-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-orange-600">Số đơn hàng</p>
                          <p className="text-lg font-semibold text-gray-900">{reportData.soLuongDonHang}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h5 className="font-medium text-gray-900">Kiểm toán tiền mặt và tiền chi</h5>

                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Tiền mặt</h6>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tiền mặt theo hệ thống</label>
                          <input type="text" value={formatCurrency(reportData.tienMat)} disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tiền mặt thực tế <span className="text-red-500">*</span></label>
                          <input type="number" value={tienMatThucTe} onChange={(e) => handleTienMatChange(e.target.value)} placeholder="Nhập số tiền thực tế đếm được" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                        </div>
                        <div>
                          <label className="block text sm font-medium text-gray-700 mb-1">Chênh lệch</label>
                          <input type="text" value={formatCurrency(reportData.chenhLechTienMat)} disabled className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${reportData.chenhLechTienMat > 0 ? "bg-green-100" : reportData.chenhLechTienMat < 0 ? "bg-red-100" : "bg-gray-100"}`} />
                        </div>
                      </div>
                      {reportData.chenhLechTienMat !== 0 && (
                        <p className={`text-sm mt-2 ${reportData.chenhLechTienMat > 0 ? "text-green-600" : "text-red-600"}`}>
                          {reportData.chenhLechTienMat > 0 ? "Thừa" : "Thiếu"} {formatCurrency(Math.abs(reportData.chenhLechTienMat))}
                        </p>
                      )}
                    </div>

                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Tiền chi</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tiền chi thực tế</label>
                          <input type="number" value={tienChiThucTe} onChange={(e) => handleTienChiChange(e.target.value)} placeholder="Nhập số tiền chi trong ca" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tiền chi hiện tại</label>
                          <input type="text" value={formatCurrency(reportData.tienChi)} disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Chi tiết đơn hàng ({reportData.donHangList.length} đơn)</h5>
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thanh toán</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.donHangList.map((order) => (
                            <tr key={order.maDonHang}>
                              <td className="px-4 py-2 text-sm text-gray-900">#{order.maDonHang}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{formatDateTime(order.ngayDatHang)}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <span className={`px-2 py-1 rounded-full text-xs ${order.phuongThucThanhToan === "Tiền mặt" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                  {order.phuongThucThanhToan}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(order.thanhTien)}</td>
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
              <button onClick={handleCloseModal} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100">Hủy</button>
              <div className="flex gap-2">
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100">Quay lại</button>
                )}
                {step === 1 && (
                  <button onClick={generateReport} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">
                    <Calculator size={16} />
                    {loading ? "Đang tạo..." : "Tạo báo cáo"}
                  </button>
                )}
                {step === 2 && (
                  <button onClick={handleSubmitChotCa} disabled={loading || !tienMatThucTe} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2">
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
