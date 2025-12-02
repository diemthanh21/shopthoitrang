import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, FileText, Package, ArrowLeftRight, DollarSign, Clipboard, FileCheck, Filter } from 'lucide-react';
import thongbaoService from '../services/thongbaoService';
import nhanvienService from '../services/nhanvienService';
import { useAuth } from '../contexts/AuthContext';

export default function ThongBaoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [nhanvienMap, setNhanvienMap] = useState({});
  const [readFilter, setReadFilter] = useState('all'); // 'all', 'unread', 'read'

  const isManager = user && ['ADMIN', 'MANAGER'].includes(user?.maQuyen);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        
        // Tải danh sách nhân viên để hiển thị tên
        const nhanviens = await nhanvienService.getAll();
        const nvMap = {};
        (nhanviens || []).forEach(nv => {
          nvMap[nv.maNhanVien] = nv.hoTen;
        });
        setNhanvienMap(nvMap);
        
        // Truyền userId để backend check is_read
        const data = await thongbaoService.getRecent({ 
          limit: 200,
          userId: user?.maNhanVien 
        });
        if (!mounted) return;
        
        // Lọc thông báo theo quyền
        const filtered = (data || []).filter(l => {
          if (l.entity === 'CHOTCA') {
            if (isManager) {
              // Quản lý xem thông báo khi nhân viên TẠO chốt ca
              return l.action === 'CREATED';
            } else {
              // Nhân viên xem thông báo khi chốt ca được DUYỆT/TỪ CHỐI
              return ['APPROVED', 'REJECTED'].includes(l.action);
            }
          }
          if (l.entity === 'PHIEUDATHANG') {
            if (isManager) {
              // Quản lý xem thông báo khi nhân viên HOÀN TẤT phiếu đặt hàng HOẶC khi hoàn thành
              return ['CREATED', 'COMPLETED'].includes(l.action);
            } else {
              // Nhân viên CHỈ xem thông báo khi phiếu ĐẶT HÀNG CỦA MÌNH được DUYỆT/TỪ CHỐI
              return l.actor_id === String(user?.maNhanVien) && 
                     ['APPROVED', 'REJECTED'].includes(l.action);
            }
          }
          if (l.entity === 'PHIEUNHAPKHO') {
            if (isManager) {
              // Quản lý xem thông báo khi nhân viên TẠO phiếu nhập kho
              return l.action === 'CREATED';
            } else {
              // Nhân viên CHỈ xem thông báo khi phiếu NHẬP KHO CỦA MÌNH được DUYỆT/TỪ CHỐI
              return l.actor_id === String(user?.maNhanVien) && 
                     ['APPROVED', 'REJECTED'].includes(l.action);
            }
          }
          if (l.entity === 'DOIHANG' || l.entity === 'TRAHANG') {
            if (isManager) {
              // Quản lý xem tất cả thông báo đổi hàng/trả hàng
              return true;
            } else {
              // Nhân viên chỉ xem thông báo liên quan đến mình
              return l.actor_id === String(user?.maNhanVien);
            }
          }
          return false;
        });
        
        // Loại bỏ duplicate: Dùng id + entity + entity_id + action + created_at làm key
        const uniqueLogs = [];
        const seen = new Set();
        
        filtered.forEach(log => {
          // Tạo key unique dựa trên nhiều trường để tránh xóa nhầm thông báo khác nhau
          const key = `${log.entity}_${log.entity_id}_${log.action}_${log.created_at}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueLogs.push(log);
          }
        });
        
        setLogs(uniqueLogs);
      } catch (e) {
        console.error('[ThongBaoPage] load logs', e?.message || e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user, isManager]);

  // Filter logs khi readFilter thay đổi
  useEffect(() => {
    if (readFilter === 'all') {
      setFilteredLogs(logs);
    } else if (readFilter === 'unread') {
      setFilteredLogs(logs.filter(l => !l.is_read));
    } else if (readFilter === 'read') {
      setFilteredLogs(logs.filter(l => l.is_read));
    }
  }, [logs, readFilter]);

  const handleClickNotification = async (log) => {
    // Đánh dấu đã đọc
    try {
      await thongbaoService.markAsRead(
        user?.maNhanVien,
        log.entity,
        log.entity_id,
        log.action
      );
      
      // Cập nhật state local
      setLogs(prevLogs => prevLogs.map(l => {
        if (l.entity === log.entity && 
            l.entity_id === log.entity_id && 
            l.action === log.action) {
          return { ...l, is_read: true };
        }
        return l;
      }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
    
    // Navigate
    if (log.entity === 'CHOTCA') {
      navigate(`/chotca/${log.entity_id}`);
    } else if (log.entity === 'DOIHANG') {
      navigate(`/doihang/${log.entity_id}`);
    } else if (log.entity === 'TRAHANG') {
      navigate(`/trahang/${log.entity_id}`);
    } else if (log.entity === 'PHIEUDATHANG') {
      navigate(`/phieudathang/${log.entity_id}`);
    } else if (log.entity === 'PHIEUNHAPKHO') {
      navigate(`/phieunhapkho/${log.entity_id}`);
    }
  };

  const getEntityIcon = (entity) => {
    switch(entity) {
      case 'CHOTCA': return <DollarSign className="w-5 h-5" />;
      case 'DOIHANG': return <ArrowLeftRight className="w-5 h-5" />;
      case 'TRAHANG': return <Package className="w-5 h-5" />;
      case 'PHIEUDATHANG': return <Clipboard className="w-5 h-5" />;
      case 'PHIEUNHAPKHO': return <FileCheck className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getEntityColor = (entity) => {
    switch(entity) {
      case 'CHOTCA': return 'bg-green-100 text-green-700 border-green-200';
      case 'DOIHANG': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'TRAHANG': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'PHIEUDATHANG': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'PHIEUNHAPKHO': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getActionBadge = (action, entity) => {
    const colors = {
      'CREATED': 'bg-yellow-100 text-yellow-700',
      'APPROVED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700',
      'UPDATED': 'bg-blue-100 text-blue-700',
      'COMPLETED': 'bg-teal-100 text-teal-700',
    };
    const labels = {
      'CREATED': (entity === 'PHIEUDATHANG' || entity === 'PHIEUNHAPKHO') ? 'Chờ xác nhận' : 'Tạo mới',
      'APPROVED': 'Đã duyệt',
      'REJECTED': 'Từ chối',
      'UPDATED': 'Cập nhật',
      'COMPLETED': 'Hoàn thành',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[action] || 'bg-gray-100 text-gray-700'}`}>
        {labels[action] || action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <Filter className="text-gray-500" size={20} />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setReadFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                readFilter === 'all' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setReadFilter('unread')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                readFilter === 'unread' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chưa đọc
            </button>
            <button
              onClick={() => setReadFilter('read')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                readFilter === 'read' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Đã đọc
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">Đang tải...</span>
        </div>
      )}
      
      {!loading && logs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">Chưa có thông báo nào</p>
          <p className="text-sm text-gray-500 mt-2">Các hoạt động của bạn sẽ được hiển thị ở đây</p>
        </div>
      )}

      {!loading && filteredLogs.length > 0 && (() => {
        const total = filteredLogs.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const current = Math.min(Math.max(1, page), totalPages);
        const start = (current - 1) * pageSize;
        const pageItems = filteredLogs.slice(start, start + pageSize);

        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {pageItems.map((l, idx) => {
                const colorClass = getEntityColor(l.entity);
                return (
                  <div 
                    key={start + idx} 
                    className="bg-white rounded-xl border hover:border-blue-300 hover:shadow-md transition-all cursor-pointer p-4 relative"
                    onClick={() => handleClickNotification(l)}
                  >
                    {/* Dấu chấm đỏ cho thông báo chưa đọc */}
                    {!l.is_read && (
                      <div className="absolute top-4 left-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${colorClass} ${!l.is_read ? 'ml-4' : ''}`}>
                        {getEntityIcon(l.entity)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
                            {l.entity}
                          </span>
                          {getActionBadge(l.action, l.entity)}
                          <span className="text-sm text-gray-500">#{l.entity_id}</span>
                        </div>
                        
                        <p className="text-gray-900 font-medium mb-1">{l.note || 'Không có ghi chú'}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(l.created_at).toLocaleString('vi-VN')}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {l.actor_type === 'NHANVIEN' && l.actor_id 
                              ? nhanvienMap[l.actor_id] || `Nhân viên #${l.actor_id}`
                              : l.actor_type === 'ADMIN' 
                              ? 'Quản lý'
                              : l.actor_type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-600">
                Hiển thị {start + 1}–{Math.min(start + pageItems.length, total)} trên {total} thông báo
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={current <= 1}
                >
                  Trước
                </button>
                <span className="px-3 text-sm font-medium text-gray-700">
                  Trang {current} / {totalPages}
                </span>
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={current >= totalPages}
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
