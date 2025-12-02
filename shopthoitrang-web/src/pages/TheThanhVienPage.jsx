import { useEffect, useMemo, useState } from 'react';
import { Form, Input, Modal, Switch, message } from 'antd';
import { RefreshCw, Settings2 } from 'lucide-react';
import thethanhvienService from '../services/thethanhvienService';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

export default function TheThanhVienPage() {
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState('');
  const [cardLoading, setCardLoading] = useState(true);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [cardForm] = Form.useForm();

  const loadCards = async () => {
    try {
      setCardLoading(true);
      const data = await thethanhvienService.getAll();
      setCards(data);
    } catch (err) {
      console.error(err);
      message.error('Khong the tai danh sach the');
    } finally {
      setCardLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleToggleCard = async (card) => {
    try {
      await thethanhvienService.update(card.mathe, { trangthai: !card.trangthai });
      loadCards();
    } catch (err) {
      console.error(err);
      message.error('Khong the thay doi trang thai');
    }
  };

  const handleOpenCardModal = (card) => {
    setEditingCard(card);
    setCardModalOpen(true);
    if (card) {
      cardForm.setFieldsValue({
        trangthai: card.trangthai ?? true,
      });
    } else {
      cardForm.resetFields();
    }
  };

  const handleSaveCard = async () => {
    try {
      const values = await cardForm.validateFields();
      const payload = {
        trangthai: values.trangthai,
      };
      await thethanhvienService.update(editingCard.mathe, payload);
      message.success('Da cap nhat the');
      setCardModalOpen(false);
      setEditingCard(null);
      loadCards();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error('Khong the cap nhat the');
    }
  };

  const handleSyncCards = async () => {
    const ok = window.confirm('Dong bo the cho tat ca khach hang chua co?');
    if (!ok) return;
    try {
      setSyncing(true);
      const res = await thethanhvienService.syncAll();
      message.success(res.message || 'Da dong bo the');
      loadCards();
    } catch (err) {
      console.error(err);
      message.error('Khong the dong bo');
    } finally {
      setSyncing(false);
    }
  };

  const handleReleasePending = async () => {
    try {
      setReleasing(true);
      const res = await thethanhvienService.releasePendingPoints();
      message.success(res.message || 'Da chuyen diem cho');
      loadCards();
    } catch (err) {
      console.error(err);
      message.error('Khong the chuyen diem cho');
    } finally {
      setReleasing(false);
    }
  };



  const stats = useMemo(() => {
    const total = cards.length;
    const active = cards.filter((card) => card.trangthai).length;
    const pointsAvailable = cards.reduce((sum, card) => sum + Number(card.diem_hien_tai || 0), 0);
    const pointsPending = cards.reduce((sum, card) => sum + Number(card.diem_pending || 0), 0);
    const pointsYearly = cards.reduce((sum, card) => sum + Number(card.diem_nam_hien_tai || 0), 0);
    return { total, active, pointsAvailable, pointsPending, pointsYearly };
  }, [cards]);

  const filteredCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cards;
    if (!Array.isArray(cards)) return [];
    return cards.filter((card) => {
      if (!card) return false;
      const haystacks = [
        card.mathe,
        card.makhachhang,
        card.customer?.hoten,
        card.customer?.email,
        card.customer?.sodienthoai,
      ]
        .filter((val) => val != null && val !== '')
        .map((value) => String(value).toLowerCase());
      
      if (haystacks.length === 0) return false;
      return haystacks.some((text) => text.includes(term));
    });
  }, [cards, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">The thanh vien</h1>
          <p className="text-gray-600">Quan ly hang the, diem tich luy va uu dai</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleReleasePending}
            disabled={releasing}
            className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-60"
          >
            <RefreshCw size={16} /> {releasing ? 'Dang xu ly...' : 'Chuyen diem cho'}
          </button>
          <button
            onClick={handleSyncCards}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <RefreshCw size={16} /> {syncing ? 'Dang dong bo...' : 'Dong bo the'}
          </button>
          <button
            onClick={loadCards}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Lam moi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard title="Tong the" value={formatNumber(stats.total)} subtitle="The da tao" />
        <StatCard title="Dang hoat dong" value={formatNumber(stats.active)} subtitle="The mo" accent="bg-green-50 text-green-700" />
        <StatCard title="Diem kha dung" value={formatNumber(stats.pointsAvailable)} subtitle="Co the su dung" accent="bg-blue-50 text-blue-700" />
        <StatCard title="Diem dang cho" value={formatNumber(stats.pointsPending)} subtitle="Se cong sau 7 ngay" accent="bg-purple-50 text-purple-700" />
        <StatCard title="Diem nam nay" value={formatNumber(stats.pointsYearly)} subtitle="Tich luy trong nam" accent="bg-indigo-50 text-indigo-700" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">

        <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex-1 min-w-[220px]">
                <Settings2 size={16} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tim ten, email hoac hang"
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
            </div>

            {cardLoading ? (
              <div className="py-12 text-center text-gray-500">Dang tai danh sach the...</div>
            ) : filteredCards.length === 0 ? (
              <div className="py-12 text-center text-gray-500">Khong tim thay the phu hop.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Ma the</th>
                      <th className="px-4 py-3 text-left">Khach hang</th>
                      <th className="px-4 py-3 text-right">Diem kha dung</th>
                      <th className="px-4 py-3 text-right">Diem cho</th>
                      <th className="px-4 py-3 text-right">Diem nam nay</th>
                      <th className="px-4 py-3 text-left">Ngay cap</th>
                      <th className="px-4 py-3 text-center">Trang thai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCards.map((card) => (
                      <tr key={card.mathe} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">#{card.mathe}</div>
                          <div className="text-xs text-gray-500">KH #{card.makhachhang}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{card.customer?.hoten || '---'}</div>
                          <div className="text-xs text-gray-500">{card.customer?.email || ''}</div>
                          <div className="text-xs text-gray-500">{card.customer?.sodienthoai || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">{formatNumber(card.diem_hien_tai)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatNumber(card.diem_pending)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatNumber(card.diem_nam_hien_tai)}</td>
                        <td className="px-4 py-3 text-gray-700">
                          <div>{card.ngaycap ? new Date(card.ngaycap).toLocaleDateString('vi-VN') : '---'}</div>
                          <div className="text-xs text-gray-500">Nam: {card.nam_diem || '---'}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch checked={card.trangthai} onChange={() => handleToggleCard(card)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </div>

      <Modal
        title={editingCard ? `Cap nhat the #${editingCard.mathe}` : 'Cap nhat the'}
        open={cardModalOpen}
        onCancel={() => {
          setCardModalOpen(false);
          setEditingCard(null);
        }}
        onOk={handleSaveCard}
        okText="Luu"
      >
        <Form form={cardForm} layout="vertical">
          <Form.Item label="Khach hang">
            <Input value={editingCard?.customer?.hoten || '---'} disabled />
          </Form.Item>
          <Form.Item label="Diem hien tai">
            <Input value={formatNumber(editingCard?.diem_hien_tai || 0)} disabled />
          </Form.Item>
          <Form.Item label="Diem cho duyet">
            <Input value={formatNumber(editingCard?.diem_pending || 0)} disabled />
          </Form.Item>
          <Form.Item name="trangthai" label="Trang thai" valuePropName="checked">
            <Switch checkedChildren="Hoat dong" unCheckedChildren="Ngung" />
          </Form.Item>
        </Form>
      </Modal>


    </div>
  );
}



function StatCard({ title, value, subtitle, accent }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ${accent ? accent : ''}`}>
      <div className="text-xs uppercase text-gray-500">{title}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}
