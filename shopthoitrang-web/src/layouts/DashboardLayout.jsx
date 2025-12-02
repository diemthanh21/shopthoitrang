import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient";
import thongbaoService from "../services/thongbaoService";
import {
  LayoutDashboard,
  Users,
  Package,
  Tag,
  ShoppingCart,
  LogOut,
  UserCircle,
  User,
  FileText,
  Building2,
  Bell,
  MessageSquareText,
} from "lucide-react";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [openAccount, setOpenAccount] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDot, setShowNotificationDot] = useState(false);
  const dropdownRef = useRef(null);

  const isManager = user && ['ADMIN', 'MANAGER'].includes(user?.maQuyen);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Load unread notification count
  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const logs = await thongbaoService.getRecent({ limit: 100 });
      
      // Lọc theo quyền
      const filtered = (logs || []).filter(l => {
        if (l.entity === 'CHOTCA') {
          if (isManager) {
            // Quản lý xem thông báo khi nhân viên TẠO chốt ca
            return l.action === 'CREATED';
          } else {
            // Nhân viên xem thông báo khi chốt ca của mình được DUYỆT/TỪ CHỐI
            return l.actor_id === String(user?.maNhanVien) && 
                   ['APPROVED', 'REJECTED'].includes(l.action);
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
      
      // Loại bỏ duplicate: Dùng created_at để tránh xóa nhầm thông báo khác nhau
      const uniqueLogs = [];
      const seen = new Set();
      
      filtered.forEach(log => {
        const key = `${log.entity}_${log.entity_id}_${log.action}_${log.created_at}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueLogs.push(log);
        }
      });
      
      // Đếm thông báo mới trong 24h
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const recentLogs = uniqueLogs.filter(l => {
        const logTime = new Date(l.created_at);
        return logTime > oneDayAgo;
      });
      
      setUnreadCount(recentLogs.length);
      setShowNotificationDot(recentLogs.length > 0);
    } catch (e) {
      console.error('[DashboardLayout] Failed to load notifications:', e);
    }
  };

  // Realtime listener cho chốt ca mới
  useEffect(() => {
    if (!user || !supabase) return;
    
    loadUnreadCount();
    
    // Lắng nghe thay đổi trong bảng chotca_log
    const channel = supabase
      .channel('chotca_log_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chotca_log' },
        (payload) => {
          console.log('[DashboardLayout] New chotca_log event:', payload);
          loadUnreadCount();
          setShowNotificationDot(true);
        }
      )
      .subscribe();
    
    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, isManager]);

  // Reset notification dot khi vào trang thông báo
  useEffect(() => {
    if (location.pathname === '/thongbao') {
      setShowNotificationDot(false);
    }
  }, [location.pathname]);

  // 🔹 Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setOpenAccount(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔹 Menu nhóm
  const menus = [
    {
      label: "Tổng quan",
      icon: LayoutDashboard,
      link: "/dashboard",
    },
    
    {
      label: "Nhân viên",
      icon: Users,
      items: [
        { label: "Danh sách nhân viên", link: "/nhanvien" },
        { label: "Tài khoản nhân viên", link: "/taikhoannhanvien" },
        { label: "Ca làm việc", link: "/calamviec" },
        { label: "Phân công ca", link: "/phancongca" },
        { label: "Chốt ca", link: "/chotca" },
        
        
      ],
    },
    {
      label: "Sản phẩm",
      icon: Package,
      items: [
        { label: "Danh sách sản phẩm", link: "/sanpham" },
        { label: "Kích thước", link: "/kichthuoc" },
        { label: "Danh mục", link: "/danhmuc" },
      ],
    },
    {
      label: "Khuyến mãi",
      icon: Tag,
      items: [{ label: "Chương trình khuyến mãi", link: "/khuyenmai" },
        { label: "Voucher giảm giá", link: "/vouchergiamgia" }
      ],
    },
    {
      label: "Đơn hàng",
      icon: ShoppingCart,
      items: [
        { label: "Danh sách đơn hàng", link: "/donhang" },
        { label: "Trả hàng/Hoàn tiền", link: "/trahang" },
        { label: "Đổi hàng", link: "/doihang" },
      ],
    },
    {
      label: "Khách hàng",
      icon: User,
      items: [
        { label: "Danh sách khách hàng", link: "/khachhang" },
        { label: "Thẻ thành viên", link: "/thethanhvien" },
      ],
    },
    {
      label: "Chứng từ",
      icon: FileText,
      items: [
        { label: "Nhà cung cấp", link: "/nhacungcap" },
        { label: "Phiếu đặt hàng", link: "/phieudathang" },
        { label: "Phiếu nhập kho", link: "/phieunhapkho" },
      ],
    },
    {
      label: "Thông báo",
      icon: Bell,
      badge: null,
      showDot: showNotificationDot,
      items: [
        { label: "Tin nhắn", link: "/tinnhan", icon: MessageSquareText },
        { label: "Đánh giá", link: "/danhgia" },
        { label: "Thông báo hệ thống", link: "/thongbao" },
      ],
    },
    {
      label: "Khác",
      icon: Building2,
      items: [
        
        { label: "Banner", link: "/banner" },
      ],
    },
  ];

  // 🔹 Hàm kiểm tra active
  const isMenuActive = (menu) => {
    if (menu.link && location.pathname === menu.link) return true;
    if (menu.items) {
      return menu.items.some((item) =>
        location.pathname.startsWith(item.link)
      );
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 py-3" ref={dropdownRef}>
          {/* Logo */}
          <h2 className="text-xl font-bold text-blue-600">ELORA</h2>

          {/* Menu ngang */}
          <nav className="flex items-center gap-6">
            {menus.map((menu, i) => {
              const Icon = menu.icon;
              const active = isMenuActive(menu);

              if (menu.items) {
                return (
                  <div key={i} className="relative">
                    <button
                      onClick={() =>
                        setOpenDropdown(openDropdown === i ? null : i)
                      }
                      className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors focus:outline-none ${
                        active
                          ? "text-blue-600 font-medium border-b-2 border-blue-600"
                          : "text-gray-700 hover:text-blue-500"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{menu.label}</span>
                      {menu.badge && (
                        <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                          {menu.badge}
                        </span>
                      )}
                      {menu.showDot && !menu.badge && (
                        <span className="ml-1 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </button>

                    {/* Dropdown nội dung */}
                    {openDropdown === i && (
                      <div
                        className="absolute left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px] z-40 animate-fadeIn"
                        role="menu"
                      >
                        {menu.items.map((item, idx) => (
                          <Link
                            key={idx}
                            to={item.link}
                            className={`block px-4 py-2 text-sm transition-colors ${
                              location.pathname === item.link
                                ? "text-blue-600 bg-blue-50"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                            onClick={() => setOpenDropdown(null)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Mục đơn
              return (
                <Link
                  key={menu.link}
                  to={menu.link}
                  className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                    active
                      ? "text-blue-600 font-medium border-b-2 border-blue-600"
                      : "text-gray-700 hover:text-blue-500"
                  }`}
                >
                  <Icon size={18} />
                  <span>{menu.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Dropdown tài khoản */}
          <div className="relative">
            <button
              onClick={() => setOpenAccount(!openAccount)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
            >
              <UserCircle size={20} />
              <span>Tài khoản</span>
            </button>

            {openAccount && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-40 animate-fadeIn"
                role="menu"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.tenDangNhap || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.maNhanVien ? "Nhân viên" : "Quản lý"}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setOpenAccount(false);
                    navigate('/me');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Thông tin nhân viên
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <div className="flex items-center gap-2">
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="p-6">
        <Outlet />
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;