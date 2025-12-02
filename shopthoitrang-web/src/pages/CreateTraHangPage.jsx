import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Upload, AlertCircle } from 'lucide-react';
import trahangService from '../services/trahangService';
import donhangService from '../services/donhangService';
import khachhangService from '../services/khachhangService';
import uploadService from '../services/uploadService';
import { useAuth } from '../contexts/AuthContext';

export default function CreateTraHangPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    maDonHang: '',
    maKhachHang: '',
    maChiTietSanPham: '',
    soLuong: 1,
    lyDo: '',
    hinhAnhLoi: '',
    ghiChu: '', // Thêm trường ghi chú
  });

  // Search states
  const [orderSearch, setOrderSearch] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [searchingOrder, setSearchingOrder] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);

  // Image upload
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  // Search order by ID
  const searchOrder = async () => {
    if (!orderSearch.trim()) {
      setError('Vui lòng nhập mã đơn hàng');
      return;
    }

    try {
      setSearchingOrder(true);
      setError('');
      setOrderDetails(null);
      setAvailableItems([]);

      const order = await donhangService.getById(orderSearch.trim());
      
      if (!order) {
        setError('Không tìm thấy đơn hàng');
        return;
      }

      // Check if order is delivered
      if (order.trangThaiDonHang !== 'Đã giao') {
        setError('Chỉ có thể tạo trả hàng cho đơn đã giao');
        return;
      }

      setOrderDetails(order);
      setFormData(prev => ({
        ...prev,
        maDonHang: order.maDonHang,
        maKhachHang: order.maKhachHang,
      }));

      // Load order items
      if (order.items && order.items.length > 0) {
        setAvailableItems(order.items);
      }

    } catch (e) {
      console.error('Error searching order:', e);
      setError(e?.response?.data?.message || 'Không thể tìm kiếm đơn hàng');
    } finally {
      setSearchingOrder(false);
    }
  };

  // Handle form field change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Handle item selection
  const handleItemSelect = (item) => {
    handleChange('maChiTietSanPham', item.maChiTietSanPham);
    handleChange('soLuong', 1);
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    // Validate order selected
    if (!formData.maDonHang) {
      setError('Vui lòng tìm đơn hàng trước khi upload ảnh');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const { url } = await uploadService.uploadReturnMedia(file, formData.maDonHang);
      handleChange('hinhAnhLoi', url);

    } catch (e) {
      console.error('Error uploading image:', e);
      setError(e.response?.data?.message || 'Không thể tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.maDonHang) {
      setError('Vui lòng chọn đơn hàng');
      return;
    }

    if (!formData.maChiTietSanPham) {
      setError('Vui lòng chọn sản phẩm');
      return;
    }

    if (!formData.soLuong || formData.soLuong < 1) {
      setError('Số lượng phải lớn hơn 0');
      return;
    }

    if (!formData.lyDo.trim()) {
      setError('Vui lòng nhập lý do trả hàng');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        maDonHang: Number(formData.maDonHang),
        maKhachHang: Number(formData.maKhachHang),
        maChiTietSanPham: Number(formData.maChiTietSanPham),
        soLuong: Number(formData.soLuong),
        lyDo: formData.lyDo.trim(),
        hinhAnhLoi: formData.hinhAnhLoi || null,
        maNhanVien: user?.maNhanVien || user?.manhanvien || null, // Thêm mã nhân viên
        ghiChu: formData.ghiChu.trim() || null, // Thêm ghi chú
        ngayYeuCau: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // Thêm trường ngày yêu cầu theo múi giờ VN
      };

      console.log('Creating return request:', payload);
      
      // Validate all IDs are valid numbers
      if (!payload.maDonHang || isNaN(payload.maDonHang)) {
        setError('Mã đơn hàng không hợp lệ');
        return;
      }
      if (!payload.maKhachHang || isNaN(payload.maKhachHang)) {
        setError('Mã khách hàng không hợp lệ');
        return;
      }
      if (!payload.maChiTietSanPham || isNaN(payload.maChiTietSanPham)) {
        setError('Mã chi tiết sản phẩm không hợp lệ');
        return;
      }

      await trahangService.create(payload);

      setSuccess('Tạo phiếu trả hàng thành công!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/trahang');
      }, 2000);

    } catch (e) {
      console.error('Error creating return:', e);
      setError(e?.response?.data?.message || 'Không thể tạo phiếu trả hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/trahang')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tạo phiếu trả hàng</h1>
              <p className="text-sm text-gray-600 mt-1">Tạo yêu cầu trả hàng/hoàn tiền cho đơn hàng đã giao</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-green-600 flex-shrink-0" size={20} />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Order */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tìm đơn hàng</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Nhập mã đơn hàng"
                className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={searchOrder}
                disabled={searchingOrder}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searchingOrder ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
            </div>

            {/* Order Details */}
            {orderDetails && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Thông tin đơn hàng</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Mã đơn:</span>
                    <span className="ml-2 font-medium">#{orderDetails.maDonHang}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Khách hàng:</span>
                    <span className="ml-2 font-medium">#{orderDetails.maKhachHang}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className="ml-2 font-medium">{orderDetails.trangThaiDonHang}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Thanh toán:</span>
                    <span className="ml-2 font-medium">{orderDetails.trangThaiThanhToan}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Select Product */}
          {orderDetails && availableItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chọn sản phẩm trả</h2>
              <div className="space-y-3">
                {availableItems.map((item) => (
                  <div
                    key={item.maChiTietDonHang}
                    onClick={() => handleItemSelect(item)}
                    className={`border rounded-lg p-4 cursor-pointer transition ${
                      formData.maChiTietSanPham === item.maChiTietSanPham
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="selectedItem"
                        checked={formData.maChiTietSanPham === item.maChiTietSanPham}
                        onChange={() => handleItemSelect(item)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.productName || `Sản phẩm #${item.maChiTietSanPham}`}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {item.variant?.color && <span>Màu: {item.variant.color} | </span>}
                          {item.variant?.size && <span>Size: {item.variant.size} | </span>}
                          <span>Số lượng: {item.soLuong}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(item.donGia)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Return Details */}
          {formData.maChiTietSanPham && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin trả hàng</h2>
              
              <div className="space-y-4">
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng trả <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={availableItems.find(i => i.maChiTietSanPham === formData.maChiTietSanPham)?.soLuong || 1}
                    value={formData.soLuong}
                    onChange={(e) => handleChange('soLuong', e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do trả hàng <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.lyDo}
                    onChange={(e) => handleChange('lyDo', e.target.value)}
                    placeholder="Nhập lý do trả hàng (sản phẩm lỗi, không đúng mô tả, ...)"
                    rows={4}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.ghiChu}
                    onChange={(e) => handleChange('ghiChu', e.target.value)}
                    placeholder="Ghi chú thêm về đơn trả hàng..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh minh chứng
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {imagePreview ? (
                      <div className="space-y-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-xs mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            handleChange('hinhAnhLoi', '');
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto text-gray-400 mb-2" size={40} />
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            Chọn ảnh
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (tối đa 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {formData.maChiTietSanPham && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/trahang')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Package size={18} />
                {loading ? 'Đang tạo...' : 'Tạo phiếu trả hàng'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
