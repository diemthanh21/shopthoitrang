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
      // Tạm thời trả về mảng rỗng
      setMemberCards([]);
      message.info('Vui lòng sử dụng chức năng xem chi tiết thẻ từ danh sách khách hàng.');
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
    setEditingCard(null);
    form.resetFields();
  };

  // operations
  const handleSubmit = async (values) => {
    try {
      setModalVisible(false);
      message.info('Tạm thời vô hiệu hóa cập nhật từ trang chính. Vui lòng sử dụng modal chi tiết để cập nhật trạng thái.');
    } catch (error) {
      console.error(error);
      message.error('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
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
            Thay đổi
          </Button>
        </Space>
      ),
    },
  ];

return (
  <div style={{ padding: 24 }}>
    <Table
      columns={columns}
      dataSource={memberCards}
      rowKey="mathe"
      loading={loading}
    />

    <Modal
      title="Cập nhật trạng thái thẻ thành viên"
      open={modalVisible}
      onCancel={handleCancel}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          Modal.confirm({
            title: 'Xác nhận thay đổi',
            content: 'Bạn có chắc muốn thay đổi trạng thái thẻ này không?',
            okText: 'Có',
            cancelText: 'Không',
            onOk: () => handleSubmit(values),
          });
        }}
      >
        <Form.Item
          name="trangthai"
          label="Trạng thái"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
        >
          <Select placeholder="Chọn trạng thái">
            <Select.Option value={true}>Hoạt động</Select.Option>
            <Select.Option value={false}>Ngưng hoạt động</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Cập nhật
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