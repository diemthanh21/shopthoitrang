// src/pages/ChotCaDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Check, 
  X, 
  DollarSign,
  CreditCard,
  Receipt,
  FileText,
  User,
  Calendar,
  Clock,
  ShoppingBag
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import chotcaService from "../services/chotcaService";
import donhangService from "../services/donhangService";
import nhanvienService from "../services/nhanvienService";

const StatusBadge = ({ status }) => {
  const colors = {
    'Tạo mới': 'bg-blue-100 text-blue-700 border-blue-200',
    'Chờ xác nhận': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Chờ duyệt': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Đã duyệt': 'bg-green-100 text-green-700 border-green-200',
    'Từ chối': 'bg-red-100 text-red-700 border-red-200',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {status}
    </span>
  );
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount || 0);
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  return new Date(dateTime).toLocaleString('vi-VN');
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN');
};

export default function ChotCaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [chotCa, setChotCa] = useState(null);
  const [donHangList, setDonHangList] = useState([]);
  const [nhanVien, setNhanVien] = useState(null);
  const [approver, setApprover] = useState(null);

  const isManager = user?.maQuyen === 'ADMIN' || user?.maQuyen === 'MANAGER';

  useEffect(() => {
    if (id) {
      loadChotCaDetail();
    }
  }, [id]);

  const loadChotCaDetail = async () => {
    try {
      setLoading(true);
      
      // Load chi tiết chốt ca
      const chotCaData = await chotcaService.getById(id);
      setChotCa(chotCaData);

      // Load thông tin nhân viên
      const nhanVienData = await nhanvienService.getById(chotCaData.maNhanVien);
      setNhanVien(nhanVienData);

      // Nếu có người duyệt, tải thông tin để hiển thị tên
      if (chotCaData.nguoiDuyet) {
        try {
          const approverData = await nhanvienService.getById(chotCaData.nguoiDuyet);
          setApprover(approverData);
        } catch (e) {
          // ignore – sẽ fallback hiển thị mã nhân viên
        }
      }

      // Load danh sách đơn hàng (lọc theo ngày ở client để tránh lệch múi giờ)
      const allOrders = await donhangService.getAll({
        manhanvien: chotCaData.maNhanVien,
      });

      const selectedDate = String(chotCaData.ngayChotCa); // YYYY-MM-DD
      const ordersOnSelectedDate = allOrders.filter((order) => {
        if (!order.ngayDatHang) return false;
        const orderDate = String(order.ngayDatHang).split('T')[0];
        return orderDate === selectedDate;
      });

      // Lọc các đơn hàng đã được duyệt/hoàn thành
      const validOrders = ordersOnSelectedDate.filter(order => 
        ['Đã duyệt', 'Đang giao', 'Đã giao'].includes(order.trangThaiDonHang)
      );

      setDonHangList(validOrders);
    } catch (error) {
      console.error('Lỗi tải chi tiết chốt ca:', error);
      alert('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Bạn có chắc muốn duyệt báo cáo chốt ca này?')) return;
    
    try {
      setLoading(true);
      await chotcaService.approve(id, user.maNhanVien);
      alert('Đã duyệt báo cáo chốt ca thành công!');
      loadChotCaDetail(); // Reload để cập nhật trạng thái
    } catch (error) {
      console.error('Lỗi duyệt báo cáo:', error);
      alert('Có lỗi xảy ra khi duyệt báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Vui lòng nhập lý do từ chối:');
    if (!reason) return;
    
    try {
      setLoading(true);
      await chotcaService.reject(id, user.maNhanVien, reason);
      alert('Đã từ chối báo cáo chốt ca!');
      loadChotCaDetail(); // Reload để cập nhật trạng thái
    } catch (error) {
      console.error('Lỗi từ chối báo cáo:', error);
      alert('Có lỗi xảy ra khi từ chối báo cáo');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !chotCa) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải chi tiết chốt ca...</p>
        </div>
      </div>
    );
  }

  if (!chotCa) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FileText size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Không tìm thấy thông tin chốt ca</p>
          <button
            onClick={() => navigate('/chotca')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/chotca')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chi tiết chốt ca #{chotCa.maChotCa}
            </h1>
            <p className="text-gray-600">
              Ngày {formatDate(chotCa.ngayChotCa)} - {nhanVien?.hoTen || `Nhân viên #${chotCa.maNhanVien}`}
            </p>
          </div>
        </div>

        {/* Action buttons for manager */}
        {isManager && (chotCa.trangThai === 'Chờ xác nhận' || chotCa.trangThai === 'Chờ duyệt') && (
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <X size={16} />
              Từ chối
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Check size={16} />
              Duyệt
            </button>
          </div>
        )}
      </div>

      {/* Thông tin tài chính - chuyển lên ngay dưới tiêu đề */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign size={20} />
          Thông tin tài chính
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Tổng thu</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(chotCa.tongThu)}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Tiền mặt</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(chotCa.tienMat)}
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-600">Tiền chi</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(chotCa.tienChi || 0)}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Chuyển khoản</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(chotCa.tienChuyenKhoan)}
              </p>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Số đơn hàng</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {chotCa.soLuongDonHang}
            </p>
          </div>

          {chotCa.chenhLechTienMat !== null && chotCa.chenhLechTienMat !== 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Chênh lệch tiền mặt:</span>
                <span className={`text-sm font-bold ${
                  chotCa.chenhLechTienMat >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {chotCa.chenhLechTienMat >= 0 ? '+' : ''}{formatCurrency(chotCa.chenhLechTienMat)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin chốt ca */}
        <div className="lg:col-span-1 space-y-6">
          {/* Thông tin cơ bản */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Thông tin chốt ca
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                <div className="mt-1">
                  <StatusBadge status={chotCa.trangThai} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Nhân viên</label>
                <p className="mt-1 text-sm text-gray-900">
                  {nhanVien?.hoTen || `Nhân viên #${chotCa.maNhanVien}`}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Ngày chốt ca</label>
                <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <Calendar size={16} />
                  {formatDate(chotCa.ngayChotCa)}
                </p>
              </div>

              {chotCa.ghiChu && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                  <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {chotCa.ghiChu}
                  </p>
                </div>
              )}
            </div>
          </div>


          {/* Thông tin duyệt */}
          {chotCa.nguoiDuyet && (
            <div className="bg-white rounded-lg shadow border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Check size={20} />
                Thông tin duyệt
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Người duyệt</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {approver?.hoTen || `Nhân viên #${chotCa.nguoiDuyet}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày duyệt</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    <Clock size={16} />
                    {formatDateTime(chotCa.ngayDuyet)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Danh sách đơn hàng */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} />
                Danh sách đơn hàng ({donHangList.length} đơn)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã đơn hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian đặt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phương thức thanh toán
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {donHangList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <p>Không có đơn hàng nào trong ngày này</p>
                      </td>
                    </tr>
                  ) : (
                    donHangList.map((order) => (
                      <tr key={order.maDonHang} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              #{order.maDonHang}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(order.ngayDatHang)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.phuongThucThanhToan === 'Tiền mặt' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {order.phuongThucThanhToan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {order.trangThaiDonHang}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          {formatCurrency(order.thanhTien)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Tổng kết */}
            {donHangList.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">
                    Tổng cộng: {donHangList.length} đơn hàng
                  </span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(donHangList.reduce((sum, order) => sum + (order.thanhTien || 0), 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}