import { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, Percent } from 'lucide-react';
import khuyenmaiService from '../services/khuyenmaiService';

const KhuyenMaiPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const data = await khuyenmaiService.getAll();
      setPromotions(data);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách khuyến mãi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return;
    
    try {
      await khuyenmaiService.delete(id);
      fetchPromotions();
    } catch (err) {
      alert('Không thể xóa khuyến mãi');
      console.error(err);
    }
  };

  const getPromoStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 'scheduled';
    if (now > end) return 'expired';
    return 'active';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý khuyến mãi</h1>
            <p className="text-gray-600">Quản lý các chương trình khuyến mãi</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Thêm khuyến mãi
        </button>
      </div>

      {/* Promotions Grid */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {promotions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          Chưa có khuyến mãi nào
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => {
            const status = getPromoStatus(promo.ngayBatDau, promo.ngayKetThuc);
            return (
              <div
                key={promo.maKhuyenMai}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                  <div className="flex items-center justify-between text-white">
                    <h3 className="text-xl font-bold">{promo.tenKhuyenMai}</h3>
                    <Percent size={24} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-center py-6 bg-blue-50 rounded-lg">
                      <span className="text-4xl font-bold text-blue-600">
                        {promo.phanTramGiam ? `${promo.phanTramGiam}%` : `${promo.soTienGiam?.toLocaleString() || 0}đ`}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bắt đầu:</span>
                      <span className="font-medium">
                        {promo.ngayBatDau ? new Date(promo.ngayBatDau).toLocaleDateString('vi-VN') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Kết thúc:</span>
                      <span className="font-medium">
                        {promo.ngayKetThuc ? new Date(promo.ngayKetThuc).toLocaleDateString('vi-VN') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : status === 'scheduled'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {status === 'active'
                          ? 'Đang diễn ra'
                          : status === 'scheduled'
                          ? 'Sắp diễn ra'
                          : 'Đã kết thúc'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                      <Edit size={16} />
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(promo.maKhuyenMai)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KhuyenMaiPage;
