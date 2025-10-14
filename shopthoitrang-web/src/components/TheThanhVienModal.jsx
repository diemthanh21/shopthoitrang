import React, { useEffect, useState } from 'react';
import { Modal, Table, Switch, message } from 'antd';
import thethanhvienService from '../services/thethanhvienService';
import dayjs from 'dayjs';

export default function TheThanhVienModal({ makhachhang, visible, onClose }) {
  const [memberCards, setMemberCards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (!makhachhang) {
      console.log('No makhachhang provided');
      return;
    }
    console.log('Modal opened for makhachhang:', makhachhang);
    const load = async () => {
      try {
        setLoading(true);
        console.log('Calling API with makhachhang:', makhachhang);
        const data = await thethanhvienService.getByKhachHang(makhachhang);
        console.log('API response:', data);
        setMemberCards(data || []);
      } catch (err) {
        console.error('API Error:', err);
        message.error('Không thể tải dữ liệu thẻ thành viên');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [visible, makhachhang]);

  const handleToggleStatus = async (record) => {
    try {
      setLoading(true);
      await thethanhvienService.update(record.mathe, {
        ...record,
        trangthai: !record.trangthai
      });
      
      // Reload data after update
      const data = await thethanhvienService.getByKhachHang(makhachhang);
      setMemberCards(data || []);
      
      message.success('Đã cập nhật trạng thái thẻ thành viên');
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi cập nhật trạng thái thẻ thành viên');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Mã thẻ', dataIndex: 'mathe', key: 'mathe' },
    { title: 'Hạng thẻ', dataIndex: 'mahangthe', key: 'mahangthe' },
    { title: 'Ngày cấp', dataIndex: 'ngaycap', key: 'ngaycap', render: (t) => dayjs(t).format('DD/MM/YYYY') },
    { title: 'Ngày hết hạn', dataIndex: 'ngayhethan', key: 'ngayhethan', render: (t) => dayjs(t).format('DD/MM/YYYY') },
    { 
      title: 'Trạng thái', 
      dataIndex: 'trangthai', 
      key: 'trangthai', 
      render: (trangthai, record) => (
        <Switch
          checked={trangthai}
          onChange={() => handleToggleStatus(record)}
          loading={loading}
        />
      )
    },
  ];

  return (
    <Modal
      title={`Thẻ thành viên - ${makhachhang || ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Table
        columns={columns}
        dataSource={memberCards}
        rowKey="mathe"
        loading={loading}
        pagination={false}
        locale={{
          emptyText: 'Không có thẻ thành viên'
        }}
      />
    </Modal>
  );
}
