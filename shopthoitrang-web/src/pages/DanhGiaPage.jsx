import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ratingService from '../services/ratingService';
import donhangService from '../services/donhangService';
import { Star, MessageSquare, Package, ShoppingBag, Zap, Eye } from 'lucide-react';

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString('vi-VN');
  } catch {
    return ts;
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Quick reply templates
const QUICK_REPLIES = [
  'Cảm ơn bạn đã tin tưởng và ủng hộ shop! 🥰',
  'Shop rất vui khi bạn hài lòng với sản phẩm! ❤️',
  'Cảm ơn bạn đã đánh giá! Chúc bạn mua sắm vui vẻ! 😊',
  'Xin lỗi vì trải nghiệm chưa tốt. Shop sẽ cải thiện hơn ạ! 🙏',
  'Shop đã ghi nhận phản hồi và sẽ khắc phục. Cảm ơn bạn! 💪',
  'Cảm ơn góp ý quý báu! Shop luôn lắng nghe và cải thiện! 🌟'
];

const RatingDrawer = ({ open, onClose, rating, onReply }) => {
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  useEffect(() => {
    if (rating) {
      setReply(rating.phanhoitushop || '');
      // Mark as read when opening
      if (!rating.dadocbyadmin) {
        ratingService.markRead(rating.madanhgia).catch(console.error);
      }
    }
  }, [rating]);

  const handleQuickReply = (text) => {
    setReply(text);
    setShowQuickReplies(false);
  };

  const handleSubmit = async () => {
    if (!reply.trim()) {
      alert('Vui lòng nhập phản hồi');
      return;
    }
    try {
      setLoading(true);
      await ratingService.reply(rating.madanhgia, reply.trim());
      alert('Đã gửi phản hồi thành công');
      onReply && onReply();
      onClose();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Gửi phản hồi thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !rating) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-full max-w-2xl h-full bg-white shadow-xl border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white">
          <h3 className="font-semibold text-lg">Chi tiết đánh giá</h3>
          <p className="text-xs text-gray-500">Đánh giá #{rating.madanhgia}</p>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Order info */}
          {(rating.machitietdonhang || rating.madonhang) && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 font-medium text-sm mb-3">
                <ShoppingBag size={16} />
                <span>Thông tin đơn hàng</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {rating.madonhang && (
                  <div>
                    <span className="text-gray-500">Mã đơn hàng:</span>
                    <span className="ml-1 font-semibold text-blue-700">#{rating.madonhang}</span>
                  </div>
                )}
                {rating.machitietdonhang && (
                  <div>
                    <span className="text-gray-500">Mã chi tiết:</span>
                    <span className="ml-1 font-medium">#{rating.machitietdonhang}</span>
                  </div>
                )}
                {rating.ngaydathang && (
                  <div>
                    <span className="text-gray-500">Ngày đặt:</span>
                    <span className="ml-1 font-medium">{formatTime(rating.ngaydathang)}</span>
                  </div>
                )}
                {rating.trangthaidonhang && (
                  <div>
                    <span className="text-gray-500">Trạng thái:</span>
                    <span className="ml-1 font-medium text-green-600">{rating.trangthaidonhang}</span>
                  </div>
                )}
                {rating.soluongmua && (
                  <div>
                    <span className="text-gray-500">Số lượng mua:</span>
                    <span className="ml-1 font-medium">{rating.soluongmua}</span>
                  </div>
                )}
                {rating.giabanmua && (
                  <div>
                    <span className="text-gray-500">Giá mua:</span>
                    <span className="ml-1 font-medium text-red-600">{formatPrice(rating.giabanmua)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product info */}
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-700 font-medium text-sm mb-3">
              <Package size={16} />
              <span>Thông tin sản phẩm</span>
            </div>
            <div className="flex gap-3">
              {rating.hinhanhbienthe && (
                <img
                  src={rating.hinhanhbienthe}
                  alt={rating.tensanpham}
                  className="w-20 h-20 rounded object-cover border"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{rating.tensanpham || 'Sản phẩm'}</h4>
                <p className="text-xs text-gray-500 mt-1">Mã SP: #{rating.masanpham}</p>
                {(rating.mausac || rating.kichco) && (
                  <div className="flex gap-2 mt-2">
                    {rating.mausac && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        Màu: {rating.mausac}
                      </span>
                    )}
                    {rating.kichco && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        Size: {rating.kichco}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer rating */}
          <div className="bg-white border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{rating.tenkhachhang || `KH ${rating.makhachhang}`}</span>
              <span className="text-xs text-gray-400">{formatTime(rating.ngaydanhgia)}</span>
            </div>

            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < rating.diemdanhgia ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
              <span className="ml-2 text-sm font-semibold">{rating.diemdanhgia}/5</span>
            </div>

            {rating.binhluan && (
              <p className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded">{rating.binhluan}</p>
            )}

            {rating.hinhanh && (
              <div className="mt-2">
                <img src={rating.hinhanh} alt="Review" className="max-w-full rounded border" />
              </div>
            )}
          </div>

          {/* Admin reply section */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
                <MessageSquare size={16} />
                <span>Phản hồi từ Shop</span>
              </div>
              <button
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 transition"
              >
                <Zap size={14} />
                <span>Phản hồi nhanh</span>
              </button>
            </div>

            {rating.phanhoitushop && (
              <div className="bg-white p-3 rounded text-sm text-gray-700 border">
                {rating.phanhoitushop}
                {rating.ngayphanhoitushop && (
                  <p className="text-xs text-gray-400 mt-2">Đã phản hồi: {formatTime(rating.ngayphanhoitushop)}</p>
                )}
              </div>
            )}

            {/* Quick replies dropdown */}
            {showQuickReplies && (
              <div className="bg-white border rounded-lg p-2 shadow-lg space-y-1 max-h-48 overflow-y-auto">
                {QUICK_REPLIES.map((text, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickReply(text)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded transition"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Nhập phản hồi của bạn hoặc chọn phản hồi nhanh..."
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200 min-h-[100px]"
              disabled={loading}
            />
          </div>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50 transition"
          >
            Đóng
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !reply.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Đang gửi...' : rating.phanhoitushop ? 'Cập nhật' : 'Gửi phản hồi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DanhGiaPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkReply, setBulkReply] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [filterStar, setFilterStar] = useState(null); // null = all, 1-5
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'replied' | 'not_replied'

  const load = async () => {
    try {
      setLoading(true);
      const data = await ratingService.list();
      // Sort by newest first
      setList(data.sort((a, b) => new Date(b.ngaydanhgia) - new Date(a.ngaydanhgia)));
    } catch (e) {
      console.error(e);
      alert('Không tải được danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Apply client-side filters
  const filteredList = list.filter((r) => {
    if (filterStar && Number(filterStar) !== Number(r.diemdanhgia)) return false;
    if (filterStatus === 'replied' && !r.phanhoitushop) return false;
    if (filterStatus === 'not_replied' && r.phanhoitushop) return false;
    return true;
  });

  const filteredUnreadList = filteredList.filter((r) => !r.phanhoitushop);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUnreadList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUnreadList.map(r => r.madanhgia));
    }
  };

  const handleBulkReply = async () => {
    if (!bulkReply.trim()) {
      alert('Vui lòng nhập nội dung phản hồi');
      return;
    }
    
    try {
      setBulkLoading(true);
      // Reply to all selected ratings
      await Promise.all(
        selectedIds.map(id => ratingService.reply(id, bulkReply.trim()))
      );
      alert(`Đã gửi phản hồi cho ${selectedIds.length} đánh giá thành công!`);
      setShowBulkModal(false);
      setBulkReply('');
      setSelectedIds([]);
      load();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi gửi phản hồi hàng loạt');
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const viewOrderDetail = (rating) => {
    const maDonHang = rating?.madonhang || rating?.maDonHang;
    if (!maDonHang) {
      alert('Đánh giá này chưa được liên kết với đơn hàng cụ thể. Có thể khách hàng đã xóa đơn hàng hoặc đánh giá được tạo thủ công.');
      return;
    }
    // Navigate to order detail page
    navigate(`/donhang/${maDonHang}`);
  };

  const openRating = (rating) => {
    setSelected(rating);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
  };

  const handleReply = () => {
    load(); // Reload list after reply
  };

  const unreadList = list.filter((r) => !r.phanhoitushop);
  const unreadCount = unreadList.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Đánh giá sản phẩm</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
              {unreadCount} chưa phản hồi
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 transition"
            >
              Phản hồi hàng loạt ({selectedIds.length})
            </button>
          )}
          <button onClick={load} className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200 transition">
            Làm mới
          </button>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Lọc sao:</label>
          <select
            value={filterStar ?? ''}
            onChange={(e) => setFilterStar(e.target.value ? Number(e.target.value) : null)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Tất cả</option>
            {[5,4,3,2,1].map(s => (
              <option key={s} value={s}>{s} sao</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="not_replied">Chưa phản hồi</option>
            <option value="replied">Đã phản hồi</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-500">Hiển thị: {filteredList.length} kết quả</div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Chưa có đánh giá nào</div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {unreadCount > 0 && (
                  <th className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredUnreadList.length && filteredUnreadList.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-3 py-2 text-left font-medium">Khách hàng</th>
                <th className="px-3 py-2 text-left font-medium">Sản phẩm</th>
                <th className="px-3 py-2 text-center font-medium">Điểm</th>
                <th className="px-3 py-2 text-left font-medium">Bình luận</th>
                <th className="px-3 py-2 text-left font-medium">Ngày</th>
                <th className="px-3 py-2 text-center font-medium">Trạng thái</th>
                <th className="px-3 py-2 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((r) => (
                <tr key={r.madanhgia} className="border-t hover:bg-gray-50 transition">
                  {unreadCount > 0 && (
                    <td className="px-3 py-3">
                      {!r.phanhoitushop && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.madanhgia)}
                          onChange={() => toggleSelect(r.madanhgia)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      )}
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <div className="font-medium">{r.tenkhachhang || `KH #${r.makhachhang}`}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {r.hinhanhbienthe && (
                        <img src={r.hinhanhbienthe} alt="" className="w-10 h-10 rounded object-cover border" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 max-w-[180px] truncate">
                          {r.tensanpham || 'Sản phẩm'}
                        </div>
                        <div className="text-xs text-gray-400">SP {r.masanpham}</div>
                        {(r.mausac || r.kichco) && (
                          <div className="text-xs text-gray-500 truncate max-w-[180px]">
                            {[r.mausac, r.kichco].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{r.diemdanhgia}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600 max-w-[200px]">
                    <div className="truncate">{r.binhluan || ''}</div>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{formatTime(r.ngaydanhgia)}</td>
                  <td className="px-3 py-3 text-center">
                    {r.phanhoitushop ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        ✓ Đã phản hồi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                        ! Chưa phản hồi
                      </span>
                  )}
                </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openRating(r)}
                        className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                      >
                        {r.phanhoitushop ? 'Xem' : 'Phản hồi'}
                      </button>
                      <button
                        onClick={() => viewOrderDetail(r)}
                        title="Xem chi tiết đơn hàng"
                        className="inline-flex items-center justify-center p-1.5 rounded border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!r.madonhang && !r.maDonHang}
                      >
                        <Eye size={16} className={r.madonhang || r.maDonHang ? "text-gray-600" : "text-gray-400"} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk reply modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Phản hồi hàng loạt ({selectedIds.length} đánh giá)</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Chọn phản hồi nhanh:</label>
              <div className="space-y-2">
                {QUICK_REPLIES.map((text, idx) => (
                  <button
                    key={idx}
                    onClick={() => setBulkReply(text)}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 border rounded transition"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Hoặc nhập nội dung:</label>
              <textarea
                value={bulkReply}
                onChange={(e) => setBulkReply(e.target.value)}
                placeholder="Nhập nội dung phản hồi..."
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200 min-h-[100px]"
                disabled={bulkLoading}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkReply('');
                }}
                disabled={bulkLoading}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkReply}
                disabled={bulkLoading || !bulkReply.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 transition"
              >
                {bulkLoading ? 'Đang gửi...' : `Gửi ${selectedIds.length} phản hồi`}
              </button>
            </div>
          </div>
        </div>
      )}

      <RatingDrawer open={drawerOpen} onClose={closeDrawer} rating={selected} onReply={handleReply} />
    </div>
  );
}
