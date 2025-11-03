import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { EditOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons';
import danhmucService from '../services/danhmucService';

const DanhMucPage = () => {
  const [danhMuc, setDanhMuc] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDanhMuc, setEditingDanhMuc] = useState(null);
  const [form] = Form.useForm();

  // Fetch data
  const fetchDanhMuc = async () => {
    try {
      setLoading(true);
      const data = await danhmucService.getAll();
      setDanhMuc(data);
    } catch (error) {
      message.error('Không thể tải dữ liệu danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDanhMuc();
  }, []);

  // Modal handlers
  const showModal = (record = null) => {
    setEditingDanhMuc(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingDanhMuc(null);
    form.resetFields();
  };

  // CRUD operations
  const handleSubmit = async (values) => {
    try {
      if (editingDanhMuc) {
        // Kiểm tra trùng tên (ngoại trừ chính nó)
        const exists = danhMuc.some(
          dm => dm.tendanhmuc.toLowerCase() === values.tendanhmuc.toLowerCase() && 
               dm.madanhmuc !== editingDanhMuc.madanhmuc
        );
        if (exists) {
          message.error('Tên danh mục đã tồn tại!');
          return;
        }

        Modal.confirm({
          title: 'Xác nhận cập nhật',
          content: 'Bạn có chắc chắn muốn cập nhật danh mục này?',
          okText: 'Cập nhật',
          cancelText: 'Hủy',
          onOk: async () => {
            await danhmucService.update(editingDanhMuc.madanhmuc, values);
            message.success('Cập nhật danh mục thành công');
            setModalVisible(false);
            fetchDanhMuc();
          }
        });
      } else {
        // Kiểm tra trùng tên khi thêm mới
        const exists = danhMuc.some(
          dm => dm.tendanhmuc.toLowerCase() === values.tendanhmuc.toLowerCase()
        );
        if (exists) {
          message.error('Tên danh mục đã tồn tại!');
          return;
        }

        await danhmucService.create(values);
        message.success('Thêm danh mục mới thành công');
        setModalVisible(false);
        fetchDanhMuc();
      }
    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

//   const handleDelete = async (madanhmuc) => {
//     try {
//       Modal.confirm({
//         title: 'Xác nhận xóa danh mục',
//         content: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?',
//         okText: 'Xóa',
//         cancelText: 'Hủy',
//         okButtonProps: { danger: true },
//         onOk: async () => {
//           try {
//             await danhmucService.delete(madanhmuc);
//             message.success('Xóa danh mục thành công');
//             fetchDanhMuc();
//           } catch (error) {
//             if (error.response?.status === 400) {
//               message.error('Không thể xóa danh mục đang có sản phẩm!');
//             } else {
//               message.error('Không thể xóa danh mục');
//             }
//           }
//         }
//       });
//     } catch (error) {
//       message.error('Không thể xóa danh mục');
//     }
//   };

  // Table columns
  const columns = [
    {
      title: 'Mã danh mục',
      dataIndex: 'madanhmuc',
      key: 'madanhmuc',
      sorter: (a, b) => a.madanhmuc - b.madanhmuc,
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'tendanhmuc',
      key: 'tendanhmuc',
      sorter: (a, b) => a.tendanhmuc.localeCompare(b.tendanhmuc),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Sửa
          </Button>

        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TagOutlined className="text-blue-600" style={{ fontSize: '32px' }} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý danh mục</h1>
            <p className="text-gray-600">Quản lý danh mục sản phẩm trong hệ thống</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Thêm danh mục mới
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <Table
          columns={columns}
          dataSource={danhMuc}
          rowKey="madanhmuc"
          loading={loading}
        />
      </div>

      {/* Form Modal */}
      <Modal
        title={editingDanhMuc ? "Sửa danh mục" : "Thêm danh mục mới"}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="tendanhmuc"
            label="Tên danh mục"
            rules={[
              { required: true, message: 'Vui lòng nhập tên danh mục!' },
              { min: 2, message: 'Tên danh mục phải có ít nhất 2 ký tự!' },
              { max: 50, message: 'Tên danh mục không được vượt quá 50 ký tự!' },
              { 
                pattern: /^[a-zA-ZÀ-ỹ0-9\s]+$/,
                message: 'Tên danh mục chỉ được chứa chữ cái, số và khoảng trắng!' 
              },
              { whitespace: true, message: 'Tên danh mục không được chỉ chứa khoảng trắng!' }
            ]}
          >
            <Input 
              placeholder="Nhập tên danh mục" 
              maxLength={50}
              showCount
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCancel}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingDanhMuc ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DanhMucPage;