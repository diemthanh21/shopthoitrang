import { useEffect, useMemo, useState } from "react";
import { Boxes, Plus, Search, Eye } from "lucide-react";
import { Modal, Form, Input, Select, message } from "antd";
import { useNavigate } from "react-router-dom";

import sanphamService from "../services/sanphamService";
import danhmucService from "../services/danhmucService";

const PAGE_SIZE = 10;

export default function SanPhamPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [danhMucList, setDanhMucList] = useState([]);

  const [danhMucMap, setDanhMucMap] = useState({});
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");

  useEffect(() => {
    fetchData();
    fetchDanhMuc();
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
      const danhMucMapping = {};
      data.forEach((dm) => {
        danhMucMapping[dm.madanhmuc ?? dm.maDanhMuc] =
          dm.tendanhmuc ?? dm.tenDanhMuc;
      });
      setDanhMucMap(danhMucMapping);
    } catch (e) {
      console.error(e);
      message.error("Không thể tải danh sách danh mục");
    }
  }

  // Modal handlers
  const showModal = (record = null) => {
    setEditingProduct(record);
    if (record) {
      form.setFieldsValue({
        tenSanPham: record.tenSanPham,
        maDanhMuc: record.maDanhMuc,
        trangThai: record.trangThai,
      });
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter((sp) => {
      if (!term) return true;
      const haystacks = [
        String(sp.maSanPham ?? ""),
        sp.tenSanPham ?? "",
        String(sp.maDanhMuc ?? ""),
        String(sp.trangThai ?? ""),
      ].map((x) => x.toString().toLowerCase());
      return haystacks.some((x) => x.includes(term));
    });
  }, [items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE) || 1);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const handlePageInputBlur = () => {
    const num = Number(pageInput);
    if (!Number.isNaN(num) && num >= 1 && num <= totalPages) {
      setCurrentPage(num);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputKey = (e) => {
    if (e.key === "Enter") {
      handlePageInputBlur();
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Boxes className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý sản phẩm
            </h1>
            <p className="text-gray-600">
              Danh sách sản phẩm trong hệ thống
            </p>
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
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
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
            {searchTerm.trim()
              ? "Không tìm thấy sản phẩm"
              : "Chưa có sản phẩm nào"}
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã sản phẩm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên sản phẩm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Danh mục
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.map((sp) => (
                <tr key={sp.maSanPham} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {sp.maSanPham}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {sp.tenSanPham}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span title={`Mã: ${sp.maDanhMuc}`}>
                      {danhMucMap[sp.maDanhMuc] ?? "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        sp.trangThai
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sp.trangThai ? "Đang bán" : "Ngưng bán"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          navigate(`/sanpham/${sp.maSanPham}`)
                        }
                        className="text-green-600 hover:text-green-800"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-600">
            Trang {currentPage}/{totalPages} · Tổng {filtered.length} sản phẩm
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded-lg border text-sm hover:bg-blue-50 disabled:opacity-40"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>Trang</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageInputBlur}
                onKeyDown={handlePageInputKey}
                className="w-16 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              />
              <span>/ {totalPages}</span>
            </div>
            <button
              className="px-3 py-1 rounded-lg border text-sm hover:bg-blue-50 disabled:opacity-40"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Form Modal thêm/sửa sản phẩm */}
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
            trangThai: true,
          }}
        >
          <div className="space-y-4">
            <Form.Item
              name="tenSanPham"
              label="Tên sản phẩm"
              rules={[
                { required: true, message: "Vui lòng nhập tên sản phẩm!" },
                { min: 3, message: "Tên sản phẩm phải có ít nhất 3 ký tự!" },
                {
                  max: 200,
                  message: "Tên sản phẩm không được vượt quá 200 ký tự!",
                },
                {
                  whitespace: true,
                  message: "Tên sản phẩm không được chỉ chứa khoảng trắng!",
                },
              ]}
            >
              <Input placeholder="Nhập tên sản phẩm" />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="maDanhMuc"
                label="Danh mục"
                rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
              >
                <Select placeholder="Chọn danh mục">
                  {danhMucList.map((dm) => (
                    <Select.Option
                      key={dm.madanhmuc ?? dm.maDanhMuc}
                      value={dm.madanhmuc ?? dm.maDanhMuc}
                    >
                      {dm.tendanhmuc ?? dm.tenDanhMuc}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="trangThai" label="Trạng thái">
                <Select>
                  <Select.Option value={true}>Đang bán</Select.Option>
                  <Select.Option value={false}>Ngừng bán</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item name="moTa" label="Mô tả">
              <Input.TextArea rows={3} placeholder="Mô tả ngắn cho sản phẩm..." />
            </Form.Item>
          </div>

          <Form.Item className="mb-0 mt-6">
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
                {editingProduct ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
