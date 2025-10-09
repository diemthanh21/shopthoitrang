import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, DatePicker, Select, message } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import thethanhvienService from '../services/thethanhvienService';
import dayjs from 'dayjs';

const { confirm } = Modal;

const TheThanhVienPage = () => {
  const [memberCards, setMemberCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [form] = Form.useForm();

  // Fetch data
  const fetchMemberCards = async () => {
    try {
      setLoading(true);
      const data = await thethanhvienService.getAll();
      setMemberCards(data);
    } catch (error) {
      message.error('Không thể tải dữ liệu thẻ thành viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberCards();
  }, []);

  // Modal handlers
  const showModal = (record = null) => {
    setEditingCard(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        ngaycap: dayjs(record.ngaycap),
        ngayhethan: dayjs(record.ngayhethan),
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingCard(null);
  };

  // CRUD operations
  const handleSubmit = async (values) => {
    try {
      if (editingCard) {
        await thethanhvienService.update(editingCard.mathe, {
          ...values,
          ngaycap: values.ngaycap.format('YYYY-MM-DD'),
          ngayhethan: values.ngayhethan.format('YYYY-MM-DD'),
        });
        message.success('Cập nhật thẻ thành viên thành công');
      } else {
        await thethanhvienService.create({
          ...values,
          ngaycap: values.ngaycap.format('YYYY-MM-DD'),
          ngayhethan: values.ngayhethan.format('YYYY-MM-DD'),
        });
        message.success('Tạo thẻ thành viên mới thành công');
      }
      setModalVisible(false);
      fetchMemberCards();
    } catch (error) {
      message.error('Có lỗi xảy ra. Vui lòng thử lại');
    }
  };

  const handleDelete = (record) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa thẻ thành viên này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Hành động này không thể hoàn tác',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await thethanhvienService.delete(record.mathe);
          message.success('Xóa thẻ thành viên thành công');
          fetchMemberCards();
        } catch (error) {
          message.error('Có lỗi xảy ra khi xóa thẻ thành viên');
        }
      },
    });
  };

  // Table columns
  const columns = [
    {
      title: 'Mã thẻ',
      dataIndex: 'mathe',
      key: 'mathe',
    },
    {
      title: 'Mã khách hàng',
      dataIndex: 'makhachhang',
      key: 'makhachhang',
    },
    {
      title: 'Hạng thẻ',
      dataIndex: 'mahangthe',
      key: 'mahangthe',
    },
    {
      title: 'Ngày cấp',
      dataIndex: 'ngaycap',
      key: 'ngaycap',
      render: (text) => dayjs(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'ngayhethan',
      key: 'ngayhethan',
      render: (text) => dayjs(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangthai',
      key: 'trangthai',
      render: (trangthai) => (
        <span style={{ color: trangthai ? 'green' : 'red' }}>
          {trangthai ? 'Hoạt động' : 'Ngưng hoạt động'}
        </span>
      ),
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
          <Button 
            type="primary" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => showModal()}>
          Thêm thẻ thành viên mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={memberCards}
        rowKey="mathe"
        loading={loading}
      />

      <Modal
        title={editingCard ? 'Sửa thẻ thành viên' : 'Thêm thẻ thành viên mới'}
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
            name="makhachhang"
            label="Mã khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập mã khách hàng!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="mahangthe"
            label="Hạng thẻ"
            rules={[{ required: true, message: 'Vui lòng chọn hạng thẻ!' }]}
          >
            <Select>
              <Select.Option value="BRONZE">Bronze</Select.Option>
              <Select.Option value="SILVER">Silver</Select.Option>
              <Select.Option value="GOLD">Gold</Select.Option>
              <Select.Option value="PLATINUM">Platinum</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="ngaycap"
            label="Ngày cấp"
            rules={[{ required: true, message: 'Vui lòng chọn ngày cấp!' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="ngayhethan"
            label="Ngày hết hạn"
            rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn!' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="trangthai"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select>
              <Select.Option value={true}>Hoạt động</Select.Option>
              <Select.Option value={false}>Ngưng hoạt động</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingCard ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button onClick={handleCancel}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TheThanhVienPage;