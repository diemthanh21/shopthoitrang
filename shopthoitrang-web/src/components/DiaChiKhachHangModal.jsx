import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import { Edit, Trash2, Plus } from 'lucide-react';
import diachikhachhangService from '../services/diachikhachhangService';

const DiaChiKhachHangModal = ({ makhachhang, isModalOpen, onClose }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);  // liên quan handleAdd
  const [form] = Form.useForm();
  const [editingAddress, setEditingAddress] = useState(null);   // liên quan handleEdit

  useEffect(() => {
    if (isModalOpen && makhachhang) {
      fetchAddresses();
    }
  }, [isModalOpen, makhachhang]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await diachikhachhangService.getByMaKH(makhachhang);
      const data = Array.isArray(response) ? response : [];
      setAddresses(data);
    } catch (error) {
      message.error('Không thể tải danh sách địa chỉ');
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleAdd = () => {
  //   form.resetFields();
  //   setEditingAddress(null);
  //   setIsAddModalOpen(true);
  // };

  // const handleEdit = (record) => {
  //   form.setFieldsValue(record);
  //   setEditingAddress(record);
  //   setIsAddModalOpen(true);
  // };

  // const handleDelete = async (madiachi) => {
  //   try {
  //     await diachikhachhangService.delete(madiachi);
  //     message.success('Xóa địa chỉ thành công');
  //     fetchAddresses();
  //   } catch (error) {
  //     message.error('Không thể xóa địa chỉ');
  //     console.error('Error deleting address:', error);
  //   }
  // };

  // const handleSubmit = async (values) => {
  //   try {
  //     const data = {
  //       ...values,
  //       makhachhang,
  //     };

  //     let response;
  //     if (editingAddress) {
  //       // Nếu đang sửa địa chỉ
  //       response = await diachikhachhangService.update(editingAddress.madiachi, data);
  //     } else {
  //       // Nếu đang thêm địa chỉ mới
  //       response = await diachikhachhangService.create(data);
  //     }

  //     if (response) {
  //       message.success(editingAddress ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ thành công');
  //       setIsAddModalOpen(false);
  //       fetchAddresses();
  //     } else {
  //       throw new Error('Không nhận được phản hồi từ server');
  //     }
  //   } catch (error) {
  //     message.error('Không thể lưu địa chỉ: ' + (error.message || 'Lỗi không xác định'));
  //     console.error('Error saving address:', error);
  //   }
  // };

  const columns = [
    {
      title: 'Địa chỉ',
      dataIndex: 'diachi',
      key: 'diachi',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <div className="flex gap-2">
          {/* <Button
            type="text"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa địa chỉ này?"
            onConfirm={() => handleDelete(record.madiachi)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="text"
              icon={<Trash2 className="w-4 h-4" />}
              danger
            />
          </Popconfirm> */}
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="Quản lý địa chỉ"
      open={isModalOpen}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <div className="mb-4">
        {/* <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {}}
        >
          Thêm địa chỉ mới
        </Button> */}
      </div>

      <Table
        columns={columns}
        dataSource={addresses}
        loading={loading}
        rowKey="madiachi"
        pagination={false}
        scroll={{ y: 400 }}
      />

      {/* <Modal
        title={editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={() => {}}
        >
          <Form.Item
            name="diachi"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input.TextArea rows={3} placeholder="Ví dụ: Số nhà, đường, phường/xã, quận/huyện, thành phố" />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              {editingAddress ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </Form>
      </Modal> */}

    </Modal>
  );
};

export default DiaChiKhachHangModal;
