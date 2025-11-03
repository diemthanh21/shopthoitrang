import { useEffect, useState } from "react";
import { Boxes, Plus, Search, Edit, Eye } from "lucide-react";
import { Modal, Form, Input, Select, InputNumber, message } from 'antd';
import sanphamService from "../services/sanphamService";
import danhmucService from "../services/danhmucService";
import thuonghieuService from "../services/thuonghieuService";
import chitietsanphamService from "../services/chitietsanphamService";
import ProductDetailModal from "../components/product/ChiTietSanPhamModal";

export default function SanPhamPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [danhMucList, setDanhMucList] = useState([]);
  const [thuongHieuList, setThuongHieuList] = useState([]);
  
  const [danhMucMap, setDanhMucMap] = useState({});
  const [thuongHieuMap, setThuongHieuMap] = useState({});
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    fetchDanhMuc();
    fetchThuongHieu();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await sanphamService.getAll();
      setItems(data);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDanhMuc() {
    try {
      const data = await danhmucService.getAll();
      setDanhMucList(data);
      // Tạo map mã danh mục -> tên danh mục
      const danhMucMapping = {};
      data.forEach(dm => {
        danhMucMapping[dm.madanhmuc] = dm.tendanhmuc;
      });
      setDanhMucMap(danhMucMapping);
    } catch (e) {
      console.error(e);
      message.error("Không thể tải danh sách danh mục");
    }
  }

  async function fetchThuongHieu() {
    try {
      const data = await thuonghieuService.getAll();
      console.log('Dữ liệu thương hiệu:', data); // Log dữ liệu trả về
      setThuongHieuList(data);
      // Tạo map mã thương hiệu -> tên thương hiệu
      const thuongHieuMapping = {};
      data.forEach(th => {
        thuongHieuMapping[th.mathuonghieu] = th.tenthuonghieu;
      });
      setThuongHieuMap(thuongHieuMapping);
    } catch (e) {
      console.error('Lỗi khi tải thương hiệu:', e.response || e); // Log chi tiết lỗi
      message.error("Không thể tải danh sách thương hiệu: " + (e.response?.data?.message || e.message));
    }
  }

  // Modal handlers
  const showModal = (record = null) => {
    setEditingProduct(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingProduct(null);
    form.resetFields();
  };

  // Xử lý hiển thị modal chi tiết sản phẩm
  const showDetailModal = async (record) => {
    try {
      if (!record || !record.maSanPham) {
        throw new Error('Không tìm thấy mã sản phẩm');
      }

      console.log('Đang tải chi tiết cho sản phẩm:', record.maSanPham);
      setSelectedProduct(record);
      setDetailModalVisible(true); // Hiển thị modal trước khi tải dữ liệu
      setProductDetails([]); // Reset dữ liệu cũ

      const details = await chitietsanphamService.getByProductId(record.maSanPham);
      console.log('Chi tiết sản phẩm nhận được:', details);
      
      if (!details) {
        throw new Error('Không tìm thấy chi tiết sản phẩm');
      }

      // Kiểm tra và xử lý dữ liệu
      const processedDetails = Array.isArray(details) ? details : [details];
      
      // Lọc bỏ các bản ghi không hợp lệ
      const validDetails = processedDetails.filter(detail => 
        detail && detail.machitietsanpham && 
        (detail.kichthucsp || detail.mausac || detail.chatlieu)
      );

      if (validDetails.length === 0) {
        throw new Error('Không có chi tiết sản phẩm hợp lệ');
      }

      setProductDetails(validDetails);

    } catch (error) {
      console.error('Lỗi khi tải chi tiết sản phẩm:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải chi tiết sản phẩm';
      message.error(errorMessage);
      if (detailModalVisible) {
        handleDetailCancel(); // Đóng modal nếu có lỗi
      }
    }
  };

  const handleDetailCancel = () => {
    setDetailModalVisible(false);
    setSelectedProduct(null);
    setProductDetails([]);
  };

  // Form submission handler
  const handleSubmit = async (values) => {
    try {
      if (editingProduct) {
        await sanphamService.update(editingProduct.maSanPham, values);
        message.success("Cập nhật sản phẩm thành công");
      } else {
        await sanphamService.create(values);
        message.success("Thêm sản phẩm mới thành công");
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const term = searchTerm.trim().toLowerCase();
  const filtered = items.filter((sp) => {
    if (!term) return true;
    const haystacks = [
      String(sp.maSanPham ?? ""),
      sp.tenSanPham ?? "",
      String(sp.maDanhMuc ?? ""),
      String(sp.maThuongHieu ?? ""),
      String(sp.trangThai ?? "")
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
          <Boxes className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
            <p className="text-gray-600">Danh sách sản phẩm trong hệ thống</p>
          </div>
        </div>
        <button 
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={() => showModal()}
        >
          <Plus size={20} />
          Thêm sản phẩm
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
              className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {term ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm nào"}
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã danh mục</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thương hiệu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((sp) => (
                <tr key={sp.maSanPham} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{sp.maSanPham}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{sp.tenSanPham}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span title={`Mã: ${sp.maDanhMuc}`}>
                      {danhMucMap[sp.maDanhMuc] ?? "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span title={`Mã: ${sp.maThuongHieu}`}>
                      {thuongHieuMap[sp.maThuongHieu] ?? "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      sp.trangThai 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sp.trangThai ? 'Đang bán' : 'Ngưng bán'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex justify-end">
                      <button
                        onClick={() => showDetailModal(sp)}
                        className="text-green-600 hover:text-green-800 mr-2"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => showModal(sp)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                        title="Sửa sản phẩm"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            trangThai: true
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="tenSanPham"
              label="Tên sản phẩm"
              rules={[
                { required: true, message: 'Vui lòng nhập tên sản phẩm!' },
                { min: 3, message: 'Tên sản phẩm phải có ít nhất 3 ký tự!' },
                { max: 200, message: 'Tên sản phẩm không được vượt quá 200 ký tự!' },
                { whitespace: true, message: 'Tên sản phẩm không được chỉ chứa khoảng trắng!' }
              ]}
            >
              <Input placeholder="Nhập tên sản phẩm" />
            </Form.Item>

            <Form.Item
              name="maDanhMuc"
              label="Danh mục"
              rules={[
                { required: true, message: 'Vui lòng chọn danh mục!' }
              ]}
            >
              <Select placeholder="Chọn danh mục">
                {danhMucList.map(dm => (
                  <Select.Option key={dm.madanhmuc} value={dm.madanhmuc}>
                    {dm.tendanhmuc}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="maThuongHieu"
              label="Thương hiệu"
              rules={[
                { required: true, message: 'Vui lòng chọn thương hiệu!' }
              ]}
            >
              <Select placeholder="Chọn thương hiệu">
                {thuongHieuList.map(th => (
                  <Select.Option key={th.mathuonghieu} value={th.mathuonghieu}>
                    {th.tenthuonghieu}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="trangThai"
              label="Trạng thái"
            >
              <Select>
                <Select.Option value={true}>Đang bán</Select.Option>
                <Select.Option value={false}>Ngưng bán</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item className="mb-0">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingProduct ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Chi tiết sản phẩm Modal */}
      <ProductDetailModal
        visible={detailModalVisible}
        onCancel={handleDetailCancel}
        product={selectedProduct}
        productDetails={productDetails}
        danhMucMap={danhMucMap}
        thuongHieuMap={thuongHieuMap}
      />
    </div>
  );
}
