import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
      label: "Thông báo",
      icon: Bell,
      items: [
        { label: "Tin nhắn", link: "/tinnhan", icon: MessageSquareText },
        { label: "Đánh giá", link: "/danhgia" },
        { label: "Thông báo hệ thống", link: "/thongbao" },
      ],
    },
    {
      label: "Nhân viên",
      icon: Users,
      items: [
        { label: "Danh sách nhân viên", link: "/nhanvien" },
        { label: "Tài khoản nhân viên", link: "/taikhoannv" },
        { label: "Phân công ca", link: "/phancongca" },
        { label: "Chốt ca", link: "/chotca" },
      ],
    },
    {
      label: "Sản phẩm",
      icon: Package,
      items: [
        { label: "Danh sách sản phẩm", link: "/sanpham" },
        { label: "Thương hiệu", link: "/thuonghieu" },
      ],
    },
    {
      label: "Khuyến mãi",
      icon: Tag,
      items: [{ label: "Chương trình khuyến mãi", link: "/khuyenmai" }],
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
        { label: "Phiếu đặt hàng", link: "/phieudathang" },
        { label: "Phiếu nhập kho", link: "/phieunhapkho" },
      ],
    },
    {
      label: "Khác",
      icon: Building2,
      items: [
        { label: "Nhà cung cấp", link: "/nhacungcap" },
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
          <h2 className="text-xl font-bold text-blue-600">Shop Thời Trang</h2>

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
                    {user?.maNhanVien ? "Nhân viên" : "Quản trị viên"}
                  </p>
                </div>

                <button
                  onClick={() => alert("Thông tin admin")}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Thông tin Admin
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
