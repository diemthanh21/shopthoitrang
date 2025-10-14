import { useState, useEffect } from "react";
import { Users, Search, Edit, MapPin, CreditCard } from "lucide-react";
import { message, Button, Popconfirm, Switch } from 'antd';
import khachhangServices from '../services/khachhangService';
import DiaChiKhachHangModal from '../components/DiaChiKhachHangModal';
import TheThanhVienModal from '../components/TheThanhVienModal';

function formatDate(v) {
  if (!v) return "N/A";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return String(v);
  }
}

export default function KhachHangPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);


  async function fetchCustomers() {
    try {
      setLoading(true);
      const data = await khachhangServices.getAll();
      setCustomers(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  }

  const fetchAddresses = async (makhachhang) => {
    try {
      setLoading(true);
      const data = await khachhangServices.getDiaChi(makhachhang);
      setAddresses(data);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);


  function handleCancel() {
    setEditMode(false);
    setEditingCustomer(null);
  }

  function handleViewAddresses(customer) {
    setSelectedCustomer(customer);
    setIsAddressModalOpen(true);
  }

  // Open member cards modal for a customer (modal will fetch its own data)
  function handleViewMemberCards(customer) {
    setSelectedCustomer(customer);
    setIsMemberModalOpen(true);
  }

  async function handleEditSubmit(e) {
    // Deprecated: replaced by toggleCustomerStatus. Keep for backwards-compatibility if called with an event.
    if (e && e.preventDefault) e.preventDefault();
    // Try to extract makhachhang if passed as argument
    let makhachhang = null;
    if (typeof e === 'string' || typeof e === 'number') {
      makhachhang = e;
    } else if (editingCustomer) {
      makhachhang = editingCustomer.makhachhang;
    }
    if (!makhachhang) {
      console.warn('No makhachhang provided to handleEditSubmit');
      return;
    }
    // toggle status
    await toggleCustomerStatus(makhachhang);
  }

  // New: toggle the danghoatdong status for a customer
  async function toggleCustomerStatus(makhachhang) {
    if (!makhachhang) return;
    try {
      // find customer in local list to determine current status
      const cust = customers.find(c => String(c.makhachhang) === String(makhachhang));
      if (!cust) {
        console.warn('Customer not found locally, fetching latest list');
        await fetchCustomers();
      }
      const current = cust ? !!cust.danghoatdong : true;
      const newStatus = !current;

      // Confirm with user
      const ok = window.confirm(`Bạn có chắc chắn muốn ${newStatus ? 'mở' : 'khóa'} khách hàng ${makhachhang}?`);
      if (!ok) return;

      await khachhangServices.update(makhachhang, { danghoatdong: newStatus });
      // update local state to reflect change immediately
      setCustomers(prev => prev.map(p => p.makhachhang === makhachhang ? { ...p, danghoatdong: newStatus } : p));
      message && message.success && message.success('Cập nhật trạng thái khách hàng thành công');
    } catch (err) {
      console.error(err);
      alert('Không thể thực hiện thay đổi này');
    }
  }

  const columns = [
    {
      title: 'Họ tên',
      dataIndex: 'hoten',
      key: 'hoten',
      sorter: (a, b) => a.hoten.localeCompare(b.hoten),
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'tendangnhap',
      key: 'tendangnhap',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'sodienthoai',
      key: 'sodienthoai',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'danghoatdong',
      key: 'danghoatdong',
      render: (active) => (
        <Switch checked={active} disabled />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<MapPin className="w-4 h-4" />}
            onClick={() => handleViewAddresses(record)}
            title="Xem địa chỉ"
          />

          <Popconfirm
            title="Bạn có chắc muốn thay đổi tại khách hàng này?"
            onConfirm={() => handleEditSubmit(record.makhachhang)}
            okText="Có"
            cancelText="Không"
          >
            <Button 
              type="text"
              icon={<Edit className="w-4 h-4" />}
              danger
              title="Thay đổi trạng thái"
            />
          </Popconfirm>

          <Button
            type="text"
            icon={<CreditCard className="w-4 h-4" />}
            onClick={() => handleViewMemberCards(record)}
            title="Chi tiết thẻ"
          />
        </div>
      ),
    },
  ];

  const term = searchTerm.trim().toLowerCase();
  const filtered = customers.filter((cust) => {
    if (!term) return true;
    const haystacks = [
      String(cust.makhachhang ?? ""),
      cust.hoten ?? "",
      cust.email ?? "",
      cust.sodienthoai ?? "",
      //cust.diachi ?? "",
      cust.tendangnhap ?? ""
    ].map((x) => x.toString().toLowerCase());
    return haystacks.some((x) => x.includes(term));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý khách hàng</h1>
            <p className="text-gray-600">Quản lý thông tin khách hàng trong hệ thống</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mọi cột…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {term ? "Không tìm thấy khách hàng" : "Chưa có khách hàng nào"}
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã KH</th>
                {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ảnh đại diện</th> */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên đăng nhập</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số điện thoại</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((customer) => (
                <tr key={customer.makhachhang} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.makhachhang}</td>
                  {/* <td className="px-4 py-3">
                    {customer.anhdaidien ? (
                      <img 
                        src={customer.anhdaidien} 
                        alt={customer.hoten}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users size={20} className="text-gray-500" />
                      </div>
                    )}
                  </td> */}
                  <td className="px-4 py-3 text-sm text-gray-900">{customer.hoten}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{customer.tendangnhap}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{customer.email || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{customer.sodienthoai || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className={`px-2 py-1 rounded-full text-xs ${customer.danghoatdong ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {customer.danghoatdong ? 'Hoạt động' : 'Khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      onClick={() => handleViewMemberCards(customer)}
                      className="text-gray-700 hover:text-gray-900 mr-3"
                      title="Chi tiết thẻ"
                    >
                      <CreditCard size={18} />
                    </button>
                    <button 
                      onClick={() => handleViewAddresses(customer)}
                      className="text-indigo-600 hover:text-indigo-800 mr-3"
                      title="Xem địa chỉ"
                    >
                      <MapPin size={18} />
                    </button>
                    <button
                      onClick={() => handleEditSubmit(customer.makhachhang)}
                      className="text-red-600 hover:text-red-800"
                      title="Thay đổi trạng thái"
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Address Modal */}
      <DiaChiKhachHangModal
        makhachhang={selectedCustomer?.makhachhang}
        isModalOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setSelectedCustomer(null);
        }}
      />

      <TheThanhVienModal
        makhachhang={selectedCustomer?.makhachhang}
        visible={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setSelectedCustomer(null);
        }}
      />
    </div>
  );
};
