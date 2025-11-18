import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Settings2, Shield, Edit3, Plus } from 'lucide-react';
import { message, Modal, Form, Select, DatePicker, Switch, Input, InputNumber } from 'antd';
import dayjs from 'dayjs';
import thethanhvienService from '../services/thethanhvienService';
import hangtheService from '../services/hangtheService';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );

const formatAmountCell = (value) => {
  if (value === null || value === undefined) return '';
  return formatCurrency(value);
};

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('vi-VN');
};

export default function TheThanhVienPage() {
  const [tab, setTab] = useState('cards');
  const [cards, setCards] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [cardLoading, setCardLoading] = useState(true);
  const [tierLoading, setTierLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardForm] = Form.useForm();
  const [tierForm] = Form.useForm();
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const loadCards = async () => {
    try {
      setCardLoading(true);
      const data = await thethanhvienService.getAll();
      setCards(data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách thẻ');
    } finally {
      setCardLoading(false);
    }
  };

  const loadTiers = async () => {
    try {
      setTierLoading(true);
      const data = await hangtheService.getAll();
      setTiers(data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải cấu hình hạng thẻ');
    } finally {
      setTierLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
    loadTiers();
  }, []);

  const handleOpenCardModal = (card) => {
    setEditingCard(card);
    setCardModalOpen(true);
    cardForm.setFieldsValue({
      mahangthe: card?.mahangthe ?? null,
      trangthai: card?.trangthai ?? true,
      ngayhethan: card?.ngayhethan ? dayjs(card.ngayhethan) : null,
    });
  };

  const handleSaveCard = async () => {
    try {
      const values = await cardForm.validateFields();
      const payload = {
        mahangthe: values.mahangthe,
        trangthai: values.trangthai,
        ngayhethan: values.ngayhethan ? values.ngayhethan.toISOString() : null,
      };
      await thethanhvienService.update(editingCard.mathe, payload);
      message.success('Đã cập nhật thẻ thành viên');
      setCardModalOpen(false);
      setEditingCard(null);
      loadCards();
    } catch (err) {
      if (err?.errorFields) return; // validation error
      console.error(err);
      message.error('Không thể cập nhật thẻ');
    }
  };

  const handleToggleCard = async (card) => {
    try {
      await thethanhvienService.update(card.mathe, { trangthai: !card.trangthai });
      loadCards();
    } catch (err) {
      console.error(err);
      message.error('Không thể thay đổi trạng thái');
    }
  };

  const handleSyncCards = async () => {
    const ok = window.confirm('Đồng bộ sẽ tự động tạo thẻ cho toàn bộ khách hàng chưa có. Bạn chắc chắn chứ?');
    if (!ok) return;
    try {
      setSyncing(true);
      const result = await thethanhvienService.syncAll();
      message.success(
        `Đã đồng bộ thẻ thành viên. Tạo mới ${result.created} thẻ cho ${result.totalCustomers} khách hàng.`,
      );
      loadCards();
    } catch (err) {
      console.error(err);
      message.error('Không thể đồng bộ thẻ');
    } finally {
      setSyncing(false);
    }
  };

  const openTierModal = (tier = null) => {
    setEditingTier(tier);
    setTierModalOpen(true);
    tierForm.setFieldsValue({
      tenhang: tier?.tenHang || '',
      dieukien_nam: tier?.dieuKienNam ?? null,
      dieukien_tichluy: tier?.dieuKienTichLuy ?? null,
      giamgia: tier?.giamGia ?? null,
      voucher_sinhnhat: tier?.voucherSinhNhat ?? null,
      uudai: tier?.uuDai ?? '',
    });
  };

  const handleSaveTier = async () => {
    try {
      const values = await tierForm.validateFields();
      const payload = {
        tenhang: values.tenhang,
        dieukien_nam: values.dieukien_nam ?? null,
        dieukien_tichluy: values.dieukien_tichluy ?? null,
        giamgia: values.giamgia ?? 0,
        voucher_sinhnhat: values.voucher_sinhnhat ?? 0,
        uudai: values.uudai ?? '',
      };

      if (editingTier) {
        await hangtheService.update(editingTier.maHangThe, payload);
        message.success('Đã cập nhật hạng thẻ');
      } else {
        await hangtheService.create(payload);
        message.success('Đã thêm hạng thẻ mới');
      }
      setTierModalOpen(false);
      setEditingTier(null);
      loadTiers();
      loadCards(); // refresh card info
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error('Không thể lưu hạng thẻ');
    }
  };

  const stats = useMemo(() => {
    const total = cards.length;
    const active = cards.filter((c) => c.trangthai).length;
    const missingTier = cards.filter((c) => !c.hangThe).length;
    return { total, active, missingTier };
  }, [cards]);

  const filteredCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cards;
    return cards.filter((card) => {
      const customer = card.customer || {};
      const tier = card.hangThe || {};
      const haystacks = [
        card.mathe,
        customer.hoten,
        customer.email,
        customer.sodienthoai,
        tier.tenhang,
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      return haystacks.some((text) => text.includes(term));
    });
  }, [cards, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thẻ thành viên</h1>
          <p className="text-gray-600">Quản lý hạng thẻ, quyền lợi và thẻ của từng khách hàng.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSyncCards}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            <RefreshCw size={16} /> {syncing ? 'Đang đồng bộ...' : 'Đồng bộ thẻ'}
          </button>
          <button
            onClick={() => {
              loadCards();
              loadTiers();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase text-gray-500">Tổng số thẻ</div>
          <div className="text-3xl font-semibold text-gray-900">{stats.total.toLocaleString('vi-VN')}</div>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm">
          <div className="text-xs uppercase text-green-600">Thẻ đang hoạt động</div>
          <div className="text-3xl font-semibold text-green-800">{stats.active.toLocaleString('vi-VN')}</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
          <div className="text-xs uppercase text-amber-600">Thiếu cấu hình</div>
          <div className="text-3xl font-semibold text-amber-800">{stats.missingTier.toLocaleString('vi-VN')}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 pt-4">
          <button
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold ${
              tab === 'cards' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setTab('cards')}
          >
            Thẻ khách hàng
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold ${
              tab === 'tiers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setTab('tiers')}
          >
            Cấu hình hạng thẻ
          </button>
        </div>

        {tab === 'cards' ? (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex-1 min-w-[220px]">
                <Settings2 size={16} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, email, hạng..."
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
            </div>

            {cardLoading ? (
              <div className="py-12 text-center text-gray-500">Đang tải danh sách thẻ...</div>
            ) : filteredCards.length === 0 ? (
              <div className="py-12 text-center text-gray-500">Không tìm thấy thẻ phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Mã thẻ</th>
                      <th className="px-4 py-3 text-left">Khách hàng</th>
                      <th className="px-4 py-3 text-left">Hạng thẻ</th>
                      <th className="px-4 py-3 text-left">Ưu đãi</th>
                      <th className="px-4 py-3 text-left">Ngày cấp</th>
                      <th className="px-4 py-3 text-left">Hết hạn</th>
                      <th className="px-4 py-3 text-center">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredCards.map((card) => (
                      <tr key={card.mathe} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">#{card.mathe}</div>
                          <div className="text-xs text-gray-500">KH #{card.makhachhang}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{card.customer?.hoten || 'Không rõ'}</div>
                          <div className="text-xs text-gray-500">{card.customer?.email || ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">
                            {card.hangThe?.tenhang || card.tenhang || 'Chưa gán'}
                          </div>
                          <div className="text-xs text-gray-500">Mã hạng: {card.mahangthe || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div>
                            Giảm {card.hangThe?.giamGia ?? card.giamgia ?? 0}% · Voucher{' '}
                            {formatCurrency(card.hangThe?.voucherSinhNhat ?? card.voucher_sinhnhat ?? 0)}
                          </div>
                          {card.hangThe?.uuDai && (
                            <div className="text-xs text-gray-500 line-clamp-1">{card.hangThe.uuDai}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(card.ngaycap)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(card.ngayhethan)}</td>
                        <td className="px-4 py-3 text-center">
                          <Switch checked={card.trangthai} onChange={() => handleToggleCard(card)} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenCardModal(card)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <Edit3 size={16} /> Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Thiết lập ngưỡng tích luỹ và quyền lợi cho từng hạng thẻ. Các thay đổi áp dụng cho những lần xét hạng
                mới.
              </p>
              <button
                onClick={() => openTierModal(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus size={16} /> Thêm hạng
              </button>
            </div>

            {tierLoading ? (
              <div className="py-12 text-center text-gray-500">Đang tải cấu hình...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Hạng</th>
                      <th className="px-4 py-3 text-left">Chi tiêu/năm</th>
                      <th className="px-4 py-3 text-left">Tích luỹ nâng hạng</th>
                      <th className="px-4 py-3 text-left">Ưu đãi</th>
                      <th className="px-4 py-3 text-left">Khác</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {tiers.map((tier) => (
                      <tr key={tier.maHangThe}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{tier.tenHang}</div>
                          <div className="text-xs text-gray-500">Mã: {tier.maHangThe}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatAmountCell(tier.dieuKienNam)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatAmountCell(tier.dieuKienTichLuy)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          Giảm {tier.giamGia ?? 0}% · Voucher {formatCurrency(tier.voucherSinhNhat ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{tier.uuDai || ''}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openTierModal(tier)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <Settings2 size={16} /> Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        title={editingCard ? `Cập nhật thẻ #${editingCard.mathe}` : 'Cập nhật thẻ'}
        open={cardModalOpen}
        onCancel={() => {
          setCardModalOpen(false);
          setEditingCard(null);
        }}
        onOk={handleSaveCard}
        okText="Lưu"
      >
        <Form form={cardForm} layout="vertical">
          <Form.Item name="mahangthe" label="Hạng thẻ" rules={[{ required: true, message: 'Chọn hạng' }]}>
            <Select placeholder="Chọn hạng thẻ">
              {tiers.map((tier) => (
                <Select.Option key={tier.maHangThe} value={tier.maHangThe}>
                  {tier.tenHang} ({tier.giamGia ?? 0}%)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="ngayhethan" label="Ngày hết hạn">
            <DatePicker className="w-full" format="DD/MM/YYYY" allowClear />
          </Form.Item>
          <Form.Item name="trangthai" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngưng" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingTier ? `Cập nhật hạng ${editingTier.tenHang}` : 'Thêm hạng thẻ mới'}
        open={tierModalOpen}
        onCancel={() => {
          setTierModalOpen(false);
          setEditingTier(null);
          tierForm.resetFields();
        }}
        onOk={handleSaveTier}
        okText="Lưu"
      >
        <Form form={tierForm} layout="vertical">
          <Form.Item name="tenhang" label="Tên hạng" rules={[{ required: true, message: 'Nhập tên hạng' }]}>
            <Input placeholder="Ví dụ: Thường, Bạc, Vàng, Kim cương..." />
          </Form.Item>
          <Form.Item name="dieukien_nam" label="Chi tiêu trong năm (VND)">
            <InputNumber className="w-full" min={0} step={500000} placeholder="Ví dụ: 12000000" />
          </Form.Item>
          <Form.Item name="dieukien_tichluy" label="Tích luỹ kể từ hạng hiện tại (VND)">
            <InputNumber className="w-full" min={0} step={500000} placeholder="Ví dụ: 5000000" />
          </Form.Item>
          <Form.Item name="giamgia" label="Giảm giá trên hoá đơn (%)">
            <InputNumber className="w-full" min={0} max={100} step={1} placeholder="Ví dụ: 10" />
          </Form.Item>
          <Form.Item name="voucher_sinhnhat" label="Voucher sinh nhật (VND)">
            <InputNumber className="w-full" min={0} step={100000} placeholder="Ví dụ: 500000" />
          </Form.Item>
          <Form.Item name="uudai" label="Ưu đãi khác">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm về quyền lợi ưu đãi" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
