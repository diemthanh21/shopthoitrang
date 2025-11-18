import { useEffect, useState } from 'react';
import { Modal, Table, Switch, message } from 'antd';
import dayjs from 'dayjs';
import thethanhvienService from '../services/thethanhvienService';

const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '');

export default function TheThanhVienModal({ makhachhang, visible, onClose }) {
  const [memberCards, setMemberCards] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!makhachhang) return;
    try {
      setLoading(true);
      const data = await thethanhvienService.getByKhachHang(makhachhang);
      setMemberCards(data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải thẻ thành viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) loadData();
  }, [visible, makhachhang]);

  const handleToggleStatus = async (record) => {
    try {
      setLoading(true);
      await thethanhvienService.update(record.mathe, { trangthai: !record.trangthai });
      await loadData();
      message.success('Đã cập nhật trạng thái thẻ');
    } catch (err) {
      console.error(err);
      message.error('Không thể cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Mã thẻ', dataIndex: 'mathe', key: 'mathe' },
    {
      title: 'Hạng thẻ',
      key: 'hangthe',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-900">{record.hangThe?.tenhang || `${record.mahangthe}`}</div>
          <div className="text-xs text-gray-500">
            Giảm {record.hangThe?.giamGia ?? record.giamgia ?? 0}% · Voucher{' '}
            {record.hangThe?.voucherSinhNhat ?? record.voucher_sinhnhat ?? 0}đ
          </div>
        </div>
      ),
    },
    { title: 'Ngày cấp', dataIndex: 'ngaycap', key: 'ngaycap', render: formatDate },
    { title: 'Ngày hết hạn', dataIndex: 'ngayhethan', key: 'ngayhethan', render: formatDate },
    {
      title: 'Trạng thái',
      dataIndex: 'trangthai',
      key: 'trangthai',
      render: (value, record) => (
        <Switch checked={value} onChange={() => handleToggleStatus(record)} loading={loading} />
      ),
    },
  ];

  return (
    <Modal
      title={`Thẻ thành viên - KH ${makhachhang || ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={780}
    >
      <Table
        columns={columns}
        dataSource={memberCards}
        rowKey="mathe"
        loading={loading}
        pagination={false}
        locale={{ emptyText: 'Khách hàng chưa có thẻ' }}
      />
    </Modal>
  );
}
