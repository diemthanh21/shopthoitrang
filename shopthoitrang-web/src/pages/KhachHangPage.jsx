import { useState, useEffect } from "react";
import { Users, Plus, Search, Edit, Trash2, X, MapPin } from "lucide-react";
import khachhangServices from '../services/khachhangService';
import DiaChiKhachHangModal from '../components/DiaChiKhachHangModal';

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

  function handleAdd() {
    window.location.href = `/khachhang/them`;
  }

  function handleEdit(customer) {
    setEditingCustomer(customer);
    setEditMode(true);
  }

  function handleCancel() {
    setEditMode(false);
    setEditingCustomer(null);
  }

  function handleViewAddresses(customer) {
    setSelectedCustomer(customer);
    setIsAddressModalOpen(true);
  }


  async function handleEditSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
      await khachhangServices.update(editingCustomer.makhachhang, {
        hoten: formData.get("hoten"),
        tendangnhap: formData.get("tendangnhap"),
        email: formData.get("email"),
        sodienthoai: formData.get("sodienthoai"),
        danghoatdong: formData.get("danghoatdong") === "on"
      });
      
      setEditMode(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Không thể cập nhật thông tin khách hàng");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) return;
    try {
      await khachhangServices.delete(id);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Không thể xóa khách hàng");
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingCustomer) {
        await khachhangServices.update(editingCustomer.makhachhang, values);
        message.success('Cập nhật khách hàng thành công');
      } else {
        await khachhangServices.create(values);
        message.success('Thêm khách hàng thành công');
      }
      setModalVisible(false);
      fetchCustomers();
    } catch (error) {
      message.error('Lỗi khi lưu thông tin khách hàng');
    }
  };

  const columns = [
    {
      title: 'Ảnh đại diện',
      dataIndex: 'anhdaidien',
      key: 'anhdaidien',
      render: (avatar) => <Avatar src={avatar} />,
    },
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
          <Button 
            type="text"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa khách hàng này?"
            onConfirm={() => handleDelete(record.makhachhang)}
            okText="Có"
            cancelText="Không"
          >
            <Button 
              type="text"
              icon={<Trash2 className="w-4 h-4" />}
              danger
              title="Xóa"
            />
          </Popconfirm>
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
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Thêm khách hàng
        </button>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ảnh đại diện</th>
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
                  <td className="px-4 py-3">
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
                  </td>
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
                      onClick={() => handleViewAddresses(customer)}
                      className="text-indigo-600 hover:text-indigo-800 mr-3"
                      title="Xem địa chỉ"
                    >
                      <MapPin size={18} />
                    </button>
                    <button 
                      onClick={() => handleEdit(customer)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                      title="Chỉnh sửa"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.makhachhang)}
                      className="text-red-600 hover:text-red-800"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
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
    </div>
  );
};
