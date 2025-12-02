import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, Calendar, DollarSign, CheckCircle, XCircle, Clock, FileText, Image as ImageIcon } from 'lucide-react';
import trService from '../services/trahangService';

// Format currency
const fmtCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

// Format date
const fmtDate = (d) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("vi-VN");
  } catch {
    return d;
  }
};

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    const s = (status || "").toLowerCase();
    if (s.includes("đã hoàn tiền") || s.includes("hoàn thành")) return "bg-green-100 text-green-700";
    if (s.includes("từ chối") || s.includes("không hợp lệ")) return "bg-red-100 text-red-700";
    if (s.includes("đã duyệt") || s.includes("đã kiểm tra")) return "bg-blue-100 text-blue-700";
    if (s.includes("chờ")) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
      {status || "N/A"}
    </span>
  );
};

// Info row component
const InfoRow = ({ label, value, icon: Icon, highlight = false }) => (
  <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
    {Icon && (
      <div className="flex-shrink-0 mt-1">
        <Icon size={18} className="text-gray-400" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-sm ${highlight ? "font-semibold text-blue-600" : "text-gray-900"}`}>
        {value || "-"}
      </div>
    </div>
  </div>
);

export default function TraHangDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [logs, setLogs] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await trService.getById(id);
      setItem(data);
      
      try {
        const logsData = await trService.getLogs(id);
        setLogs(Array.isArray(logsData) ? logsData : []);
      } catch (e) {
        console.warn('Could not load logs:', e);
        setLogs([]);
      }
      
      try {
        const previewData = await trService.refundPreview(id);
        setPreview(previewData);
      } catch (e) {
        console.warn('Could not load preview:', e);
        setPreview(null);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin trả hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="text-red-600 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Có lỗi xảy ra</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/trahang')}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Không tìm thấy phiếu trả hàng.</p>
        </div>
        <button
          onClick={() => navigate('/trahang')}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/trahang')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Phiếu trả hàng #{item.maTraHang}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Chi tiết phiếu yêu cầu trả hàng/hoàn tiền
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={item.trangThai} />
              <button
                onClick={load}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Làm mới
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Package className="text-blue-600" size={24} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-8">
                <InfoRow label="Mã phiếu trả hàng" value={`#${item.maTraHang}`} highlight />
                <InfoRow label="Mã đơn hàng" value={`#${item.maDonHang}`} highlight />
                <InfoRow label="Mã khách hàng" value={`#${item.maKhachHang}`} icon={User} />
                <InfoRow label="Mã chi tiết sản phẩm" value={`#${item.maChiTietSanPham}`} />
                <InfoRow label="Số lượng trả" value={item.soLuong} />
                <InfoRow label="Mã nhân viên" value={item.maNhanVien ? `#${item.maNhanVien}` : '-'} icon={User} />
                <InfoRow 
                  label="Nguồn tạo" 
                  value={
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      item.nguonTao === 'POS' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.nguonTao === 'POS' ? 'POS' : 'MOBILE'}
                    </span>
                  } 
                />
                <InfoRow label="Ngày yêu cầu" value={fmtDate(item.ngayYeuCau)} icon={Calendar} />
                <InfoRow label="Trạng thái" value={<StatusBadge status={item.trangThai} />} />
              </div>
            </div>

            {/* Return Reason & Note */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <FileText className="text-amber-600" size={24} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Lý do trả hàng & Ghi chú</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-2">Lý do trả hàng</div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.lyDo || '-'}</p>
                  </div>
                </div>
                {item.ghiChu && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Ghi chú</div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.ghiChu}</p>
                    </div>
                  </div>
                )}
                {item.hinhAnhLoi && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <ImageIcon size={16} />
                      <span>Hình ảnh minh chứng:</span>
                    </div>
                    <a
                      href={item.hinhAnhLoi}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block"
                    >
                      <img
                        src={item.hinhAnhLoi}
                        alt="Hình ảnh lỗi"
                        className="max-w-xs rounded-lg border hover:opacity-90 transition-opacity"
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Approval & Shipping */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Duyệt & Gửi hàng</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-8">
                <InfoRow label="Ngày duyệt" value={fmtDate(item.ngayDuyet)} icon={Calendar} />
                <InfoRow label="Địa chỉ gửi hàng" value={item.diaChiGuiHang} />
                <InfoRow label="Hướng dẫn đóng gói" value={item.huongDanDongGoi} />
                <InfoRow label="Lý do từ chối" value={item.lyDoTuChoi} />
              </div>
            </div>

            {/* Inspection */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <FileText className="text-purple-600" size={24} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Kiểm tra hàng</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-8">
                <InfoRow label="Ngày nhận hàng" value={fmtDate(item.ngayNhanHang)} icon={Calendar} />
                <InfoRow label="Ngày kiểm tra" value={fmtDate(item.ngayKiemTra)} icon={Calendar} />
                <InfoRow label="Trạng thái kiểm tra" value={item.trangThaiKiemTra} />
                <InfoRow label="Lý do không hợp lệ" value={item.lyDoKhongHopLe} />
              </div>
            </div>

            {/* Refund */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <DollarSign className="text-emerald-600" size={24} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Thông tin hoàn tiền</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-xs text-blue-600 font-semibold mb-1">Số tiền hoàn</div>
                    <div className="text-xl font-bold text-blue-700">
                      {fmtCurrency(item.soTienHoan || preview?.preview_sotien_hoan)}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-xs text-green-600 font-semibold mb-1">Phương thức</div>
                    <div className="text-lg font-bold text-green-700">
                      {item.phuongThucHoan || '-'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8">
                  <InfoRow label="Ngày hoàn tiền" value={fmtDate(item.ngayHoanTien)} icon={Calendar} />
                  <InfoRow label="Mã nhân viên xử lý" value={item.maNhanVien ? `#${item.maNhanVien}` : '-'} icon={User} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Timeline */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử thay đổi</h2>
              {!logs || logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chưa có lịch sử thay đổi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log, idx) => (
                    <div key={log.id || idx} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                      <div className="absolute left-0 top-0 -translate-x-1/2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="font-semibold text-sm text-gray-900 mb-1">
                          {log.action || "Hành động"}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {log.from_status && log.to_status ? (
                            <span>
                              <span className="font-medium">{log.from_status}</span>
                              {" → "}
                              <span className="font-medium">{log.to_status}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">Không có thay đổi trạng thái</span>
                          )}
                        </div>
                        {log.note && (
                          <div className="text-xs text-gray-700 bg-white rounded p-2 mb-2">
                            {log.note}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {fmtDate(log.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}