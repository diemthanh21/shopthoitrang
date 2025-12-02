import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';
import {
  EnvironmentOutlined,
  ReloadOutlined,
  SaveOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import phiVanChuyenService from '../services/phivanchuyenService';

const { Title, Paragraph, Text } = Typography;

const formatNumber = (value) => {
  if (value === undefined || value === null) return '0';
  const numeric = Number(value) || 0;
  return numeric.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const normalizeText = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const PhiVanChuyenPage = () => {
  const [form] = Form.useForm();
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      const config = await phiVanChuyenService.getConfig();
      form.setFieldsValue({
        tinh_kho: config?.tinh_kho || undefined,
        phi_trong_tinh: config?.phi_trong_tinh ?? 0,
        phi_ngoai_tinh: config?.phi_ngoai_tinh ?? 0,
        dang_ap_dung: config?.dang_ap_dung ?? true,
      });
      setLastUpdated(config?.updated_at || null);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải cấu hình phí vận chuyển');
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const response = await fetch('https://vietnamlabs.com/api/vietnamprovince');
      const json = await response.json();
      const options = Array.isArray(json?.data)
        ? json.data
            .map((item) => item?.province)
            .filter(Boolean)
            .map((province) => ({
              label: province,
              value: province,
            }))
        : [];
      options.sort((a, b) => a.label.localeCompare(b.label, 'vi', { sensitivity: 'base' }));
      setProvinceOptions(options);
    } catch (err) {
      console.error(err);
      message.warning('Không thể tải danh sách tỉnh thành. Bạn có thể nhập thủ công.');
    } finally {
      setLoadingProvinces(false);
    }
  };

  useEffect(() => {
    loadProvinces();
    loadConfig();
  }, []);

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      const payload = {
        tinh_kho: values.tinh_kho,
        phi_trong_tinh: values.phi_trong_tinh,
        phi_ngoai_tinh: values.phi_ngoai_tinh,
        dang_ap_dung: values.dang_ap_dung,
      };
      const updated = await phiVanChuyenService.updateConfig(payload);
      setLastUpdated(updated?.updated_at || null);
      message.success('Đã lưu cấu hình phí vận chuyển');
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      message.error(serverMessage || 'Không thể cập nhật phí vận chuyển');
    } finally {
      setSaving(false);
    }
  };

  const currentProvince = Form.useWatch('tinh_kho', form);
  const currentStatus = Form.useWatch('dang_ap_dung', form);
  const phiTrongTinh = Form.useWatch('phi_trong_tinh', form);
  const phiNgoaiTinh = Form.useWatch('phi_ngoai_tinh', form);

  const summaryItems = useMemo(
    () => [
      {
        label: 'Tỉnh kho hiện tại',
        value: currentProvince || 'Chưa chọn',
      },
      {
        label: 'Phí giao nội tỉnh',
        value: `${formatNumber(phiTrongTinh)} VND`,
      },
      {
        label: 'Phí giao ngoại tỉnh',
        value: `${formatNumber(phiNgoaiTinh)} VND`,
      },
      {
        label: 'Trạng thái áp dụng',
        value: currentStatus ? 'Đang áp dụng' : 'Tạm tắt',
      },
    ],
    [currentProvince, currentStatus, phiTrongTinh, phiNgoaiTinh]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <TruckOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <Title level={2} className="!m-0">
              Phí vận chuyển
            </Title>
            <Paragraph className="!m-0 text-gray-600">
              Thiết lập tỉnh kho nguồn và mức phí giao hàng áp dụng cho toàn bộ đơn hàng.
            </Paragraph>
          </div>
        </div>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadConfig}
            loading={loadingConfig}
          >
            Tải lại cấu hình
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={saving}
          >
            Lưu thay đổi
          </Button>
        </Space>
      </div>

      {lastUpdated && (
        <Alert
          type="info"
          showIcon
          message={`Cập nhật gần nhất: ${new Date(lastUpdated).toLocaleString('vi-VN')}`}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Thiết lập phí vận chuyển">
          <Form
            layout="vertical"
            form={form}
            initialValues={{
              dang_ap_dung: true,
              phi_trong_tinh: 0,
              phi_ngoai_tinh: 0,
            }}
            onFinish={handleSubmit}
          >
            <Form.Item
              name="tinh_kho"
              label={
                <div className="flex items-center justify-between">
                  <span>Tỉnh kho / shop gửi hàng</span>
                  <Button
                    type="link"
                    icon={<ReloadOutlined />}
                    onClick={loadProvinces}
                    size="small"
                    loading={loadingProvinces}
                  >
                    Cập nhật danh sách
                  </Button>
                </div>
              }
              rules={[{ required: true, message: 'Vui lòng chọn tỉnh kho mặc định' }]}
            >
              <Select
                showSearch
                placeholder="Chọn hoặc nhập tên tỉnh"
                options={provinceOptions}
                loading={loadingProvinces}
                notFoundContent="Không tìm thấy dữ liệu"
                filterOption={(input, option) =>
                  normalizeText(option?.label ?? '').includes(normalizeText(input))
                }
              />
            </Form.Item>

            <Form.Item
              name="phi_trong_tinh"
              label="Phí nội tỉnh"
              rules={[{ required: true, message: 'Vui lòng nhập phí nội tỉnh' }]}
            >
              <InputNumber
                min={0}
                step={1000}
                className="w-full"
                formatter={(value) => `${formatNumber(value)}`}
                parser={(value) => (value ? value.replace(/\./g, '') : '')}
                addonAfter="VND"
              />
            </Form.Item>

            <Form.Item
              name="phi_ngoai_tinh"
              label="Phí ngoại tỉnh"
              rules={[{ required: true, message: 'Vui lòng nhập phí ngoại tỉnh' }]}
            >
              <InputNumber
                min={0}
                step={1000}
                className="w-full"
                formatter={(value) => `${formatNumber(value)}`}
                parser={(value) => (value ? value.replace(/\./g, '') : '')}
                addonAfter="VND"
              />
            </Form.Item>

            <Form.Item
              name="dang_ap_dung"
              label="Trạng thái áp dụng"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Đang áp dụng"
                unCheckedChildren="Tạm tắt"
              />
            </Form.Item>
          </Form>
        </Card>

        <Card title="Thông tin nhanh" className="h-full">
          <div className="space-y-4">
            <Paragraph type="secondary" className="!mb-2">
              Các cài đặt này sẽ được dùng để tự động cộng phí ship khi khách hàng đặt hàng trên
              ứng dụng mobile. Hãy đảm bảo tỉnh kho khớp với nơi bạn gửi hàng để mức phí nội tỉnh
              được áp dụng chính xác.
            </Paragraph>
            <div className="space-y-3">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                >
                  <Text type="secondary">{item.label}</Text>
                  <Text strong>{item.value}</Text>
                </div>
              ))}
            </div>
            <Alert
              type="success"
              showIcon
              message="Lưu ý"
              description="Sau khi lưu, cấu hình mới có hiệu lực ngay lập tức cho các đơn hàng tiếp theo."
            />
            <Space align="start">
              <EnvironmentOutlined className="text-blue-500 mt-1" />
              <Text className="text-gray-600">
                Dữ liệu tỉnh thành được đồng bộ trực tiếp từ{' '}
                <a
                  href="https://vietnamlabs.com/vietnam-province"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  vietnamlabs.com
                </a>
                . Bạn có thể cập nhật danh sách bất kỳ lúc nào.
              </Text>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PhiVanChuyenPage;
