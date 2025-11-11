import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import hangtheService from '../services/hangtheService';

const HangThePage = () => {
  const [hangThe, setHangThe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHangThe, setEditingHangThe] = useState(null);
  const [form] = Form.useForm();

  // Fetch data
  const fetchHangThe = async () => {
    try {
      setLoading(true);
      const data = await hangtheService.getAll();
      setHangThe(data);
    } catch (error) {
      message.error('Không thể tải dữ liệu hạng thẻ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHangThe();
  }, []);

  // Modal handlers
  const showModal = (record = null) => {
    setEditingHangThe(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingHangThe(null);
    form.resetFields();
  };

  // Validate business rules
  const validateBusinessRules = (values) => {
    // Kiểm tra điều kiện tích lũy phải nhỏ hơn hoặc bằng điều kiện năm
    if (values.dieukien_tichluy > values.dieukien_nam) {
      message.error('Số điểm tích lũy nhỏ hơn hoặc bằng điều kiện năm!');
      return false;
    }

    // Kiểm tra tỷ lệ giảm giá hợp lý
    if (values.giamgia > 0.5) { // Giới hạn giảm giá tối đa 50%
      message.error('Tỷ lệ giảm giá không được vượt quá 50%!');
      return false;
    }

    return true;
  };

  // CRUD operations
  const handleSubmit = async (values) => {
    try {
      // Validate business rules before submitting
      if (!validateBusinessRules(values)) {
        return;
      }

      if (editingHangThe) {
        // Xác nhận trước khi cập nhật
        Modal.confirm({
          title: 'Xác nhận cập nhật',
          content: 'Bạn có chắc chắn muốn cập nhật thông tin hạng thẻ này?',
          okText: 'Cập nhật',
          cancelText: 'Hủy',
          onOk: async () => {
            try {
              await hangtheService.update(editingHangThe.mahangthe, values);
              message.success('Cập nhật hạng thẻ thành công');
              setModalVisible(false);
              fetchHangThe();
            } catch (error) {
              console.error(error);
              message.error('Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.');
            }
          }
        });
      } else {
        // Kiểm tra tên hạng thẻ đã tồn tại
        const existingCard = hangThe.find(
          card => card.tenhang.toLowerCase() === values.tenhang.toLowerCase()
        );
        if (existingCard) {
          message.error('Tên hạng thẻ đã tồn tại!');
          return;
        }

        try {
          await hangtheService.create(values);
          message.success('Thêm hạng thẻ mới thành công');
          setModalVisible(false);
          fetchHangThe();
        } catch (error) {
          console.error(error);
          message.error('Có lỗi xảy ra khi thêm mới. Vui lòng thử lại.');
        }
      }
    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (mahangthe) => {
    try {
      // Kiểm tra xem hạng thẻ có đang được sử dụng không
      const inUse = false; // TODO: Thêm API kiểm tra hạng thẻ đang được sử dụng
      if (inUse) {
        message.error('Không thể xóa hạng thẻ đang được sử dụng!');
        return;
      }

      Modal.confirm({
        title: 'Xác nhận xóa hạng thẻ',
        content: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?',
        okText: 'Xóa',
        cancelText: 'Hủy',
        okButtonProps: {
          danger: true
        },
        onOk: async () => {
          try {
            await hangtheService.delete(mahangthe);
            message.success('Xóa hạng thẻ thành công');
            fetchHangThe();
          } catch (error) {
            message.error('Không thể xóa hạng thẻ này');
          }
        }
      });
    } catch (error) {
      message.error('Không thể xóa hạng thẻ này');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Mã hạng thẻ',
      dataIndex: 'mahangthe',
      key: 'mahangthe',
    },
    {
      title: 'Tên hạng',
      dataIndex: 'tenhang',
      key: 'tenhang',
    },
    {
      title: 'Điều kiện năm',
      dataIndex: 'dieukien_nam',
      key: 'dieukien_nam',
      render: (value) => value?.toLocaleString('vi-VN'),
    },
    {
      title: 'Điểm tích lũy',
      dataIndex: 'dieukien_tichluy',
      key: 'dieukien_tichluy',
      render: (value) => value?.toLocaleString('vi-VN'),
    },
    {
      title: 'Giảm giá',
      dataIndex: 'giamgia',
      key: 'giamgia',
      render: (value) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: 'Voucher sinh nhật',
      dataIndex: 'voucher_sinhnhat',
      key: 'voucher_sinhnhat',
      render: (value) => value?.toLocaleString('vi-VN'),
    },
    {
      title: 'Ưu đãi',
      dataIndex: 'uudai',
      key: 'uudai',
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
            onClick={() => Modal.confirm({
              title: 'Xác nhận xóa',
              content: 'Bạn có chắc chắn muốn xóa hạng thẻ này?',
              onOk: () => handleDelete(record.mahangthe),
              okText: 'Xóa',
              cancelText: 'Hủy',
            })}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý hạng thẻ</h1>
          <p className="text-gray-600">Quản lý các hạng thẻ thành viên và quyền lợi</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Thêm hạng thẻ mới
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <Table
          columns={columns}
          dataSource={hangThe}
          rowKey="mahangthe"
          loading={loading}
        />
      </div>

      {/* Form Modal */}
      <Modal
        title={editingHangThe ? "Sửa hạng thẻ" : "Thêm hạng thẻ mới"}
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
            name="tenhang"
            label="Tên hạng"
            rules={[
              { required: true, message: 'Vui lòng nhập tên hạng thẻ!' },
              { min: 2, message: 'Tên hạng thẻ phải có ít nhất 2 ký tự!' },
              { max: 50, message: 'Tên hạng thẻ không được vượt quá 50 ký tự!' },
              { whitespace: true, message: 'Tên hạng thẻ không được chỉ chứa khoảng trắng!' }
            ]}
          >
            <Input placeholder="Nhập tên hạng thẻ" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="dieukien_nam"
            label="Điều kiện năm (VNĐ)"
            rules={[
              { required: true, message: 'Vui lòng nhập điều kiện năm!' },
              {
                type: 'number',
                min: 0,
                message: 'Điều kiện năm bắt đầu từ 0 VNĐ trở lên!'
              },
              {
                type: 'number',
                max: 1000000000000,
                message: 'Điều kiện năm không được vượt quá 1,000,000,000,000 VNĐ!'
              }
            ]}
          >
            <InputNumber
              className="w-full"
              min={0}
              max={1000000000000}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập điều kiện chi tiêu trong năm"
            />
          </Form.Item>

          <Form.Item
            name="dieukien_tichluy"
            label="Điểm tích lũy (VNĐ)"
            rules={[
              { required: true, message: 'Vui lòng nhập điểm tích lũy!' },
              {
                type: 'number',
                min: 0,
                message: 'Điểm tích lũy phải từ 0 VNĐ trở lên!'
              },
              {
                type: 'number',
                max: 500000000000,
                message: 'Điều kiện tích lũy không được vượt quá 500,000,000,000 VNĐ!'
              }
            ]}
            dependencies={['dieukien_nam']}
          >
            <InputNumber
              className="w-full"
              min={0}
              max={500000000000}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập số điểm tích lũy"
            />
          </Form.Item>

          <Form.Item
            name="giamgia"
            label="Giảm giá (%)"
            rules={[
              { required: true, message: 'Vui lòng nhập tỷ lệ giảm giá!' },
              {
                type: 'number',
                min: 0,
                max: 1,
                message: 'Tỷ lệ giảm giá phải từ 0% đến 100%!'
              }
            ]}
          >
            <InputNumber
              className="w-full"
              min={0}
              max={1}
              step={0.01}
              formatter={value => `${(value * 100).toFixed(1)}%`}
              parser={value => value.replace('%', '') / 100}
              placeholder="Nhập tỷ lệ giảm giá"
            />
          </Form.Item>

          <Form.Item
            name="voucher_sinhnhat"
            label="Voucher sinh nhật"
            rules={[
              { required: true, message: 'Vui lòng nhập giá trị voucher!' },
              {
                type: 'number',
                min: 0,
                message: 'Giá trị voucher có thể từ 0 VNĐ trở lên!'
              },
              {
                type: 'number',
                max: 10000000,
                message: 'Giá trị voucher không được vượt quá 10,000,000 VNĐ!'
              }
            ]}
          >
            <InputNumber
              className="w-full"
              min={0}
              max={10000000}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập giá trị voucher sinh nhật"
            />
          </Form.Item>

          <Form.Item
            name="uudai"
            label="Ưu đãi"
            rules={[
              { required: true, message: 'Vui lòng nhập thông tin ưu đãi!' },
              { min: 10, message: 'Mô tả ưu đãi phải có ít nhất 10 ký tự!' },
              { max: 500, message: 'Mô tả ưu đãi không được vượt quá 500 ký tự!' },
              { whitespace: true, message: 'Mô tả ưu đãi không được chỉ chứa khoảng trắng!' }
            ]}
          >
            <Input.TextArea 
              placeholder="Nhập mô tả ưu đãi"
              maxLength={500}
              showCount
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingHangThe ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HangThePage;
