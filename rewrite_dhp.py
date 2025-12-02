from pathlib import Path
content = """import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCcw, Search, Package } from 'lucide-react';
import exService from '../services/doihangService';

const STATUS_OPTIONS = [
  { key: 'CHO_DUYET', label: 'Cho duyet', colors: { dot: 'bg-amber-400', active: 'bg-amber-600 text-white', inactive: 'bg-amber-50 text-amber-700 border-amber-200', badge: 'bg-amber-100 text-amber-700' } },
  { key: 'DA_DUYET_CHO_GUI_HANG_CU', label: 'Da duyet - cho gui hang cu', colors: { dot: 'bg-blue-400', active: 'bg-blue-600 text-white', inactive: 'bg-blue-50 text-blue-700 border-blue-200', badge: 'bg-blue-100 text-blue-700' } },
  { key: 'DA_NHAN_HANG_CU_CHO_KIEM_TRA', label: 'Da nhan hang cu - cho kiem tra', colors: { dot: 'bg-indigo-400', active: 'bg-indigo-600 text-white', inactive: 'bg-indigo-50 text-indigo-700 border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' } },
  { key: 'KHONG_HOP_LE', label: 'Khach hang khong hop le', colors: { dot: 'bg-rose-400', active: 'bg-rose-600 text-white', inactive: 'bg-rose-50 text-rose-700 border-rose-200', badge: 'bg-rose-100 text-rose-700' } },
  { key: 'CHO_TAO_DON_MOI', label: 'Cho tao don moi', colors: { dot: 'bg-slate-400', active: 'bg-slate-600 text-white', inactive: 'bg-slate-50 text-slate-700 border-slate-200', badge: 'bg-slate-100 text-slate-700' } },
  { key: 'DANG_GIAO_HANG_MOI', label: 'Dang giao hang moi', colors: { dot: 'bg-cyan-400', active: 'bg-cyan-600 text-white', inactive: 'bg-cyan-50 text-cyan-700 border-cyan-200', badge: 'bg-cyan-100 text-cyan-700' } },
  { key: 'DA_DOI_XONG', label: 'Da doi xong', colors: { dot: 'bg-emerald-400', active: 'bg-emerald-600 text-white', inactive: 'bg-emerald-50 text-emerald-700 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' } },
  { key: 'TU_CHOI', label: 'Tu choi', colors: { dot: 'bg-red-400', active: 'bg-red-600 text-white', inactive: 'bg-red-50 text-red-700 border-red-200', badge: 'bg-red-100 text-red-700' } },
];

const STATUS_BY_KEY = STATUS_OPTIONS.reduce((acc, cur) => ({ ...acc, [cur.key]: cur }), {});

const normalizeStatus = (value) => {
  if (!value) return '';
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
};

const getStatusMeta = (value) => {
  const slug = normalizeStatus(value);
  if (STATUS_BY_KEY[slug]) return STATUS_BY_KEY[slug];
  return { key: slug, label: value || 'Khong xac dinh', colors: { dot: 'bg-gray-400', active: 'bg-gray-600 text-white', inactive: 'bg-gray-50 text-gray-700 border-gray-200', badge: 'bg-gray-100 text-gray-700' } };
};

const currency = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const formatCurrency = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return `${currency.format(num)} d`;
};

const formatDate = (value, withTime = false) => {
  if (!value) return '-';
  const date = new Date(value);
  return withTime
    ? date.toLocaleString('vi-VN', { hour12: false })
    : date.toLocaleDateString('vi-VN');
};

const getTotalAmount = (item) => {
  const candidates = [item.chenhlech, item.giamoi, item.giacu];
  const hit = candidates.find((val) => val !== null && val !== undefined);
  return hit ?? 0;
};

const getPaymentMethod = (item) => item.phuongThucXuLyChenhLech || item.paymentMethod || 'Khong xac dinh';
const getPaymentStatus = (item) => item.trangThaiTien || 'Chua cap nhat';
const getEmployeeLabel = (item) => item.nhanVienDuyet || item.maNhanVienDuyet || item.manhanvien || item.maNhanVien || '—';

const paymentBadgeClass = (status) => {
  const normalized = (status || '').toString().toUpperCase();
  if (normalized.includes('DA') || normalized.includes('DONE')) {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (normalized.includes('CHO')) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-gray-100 text-gray-700';
};

export default function DoiHangPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState({ status: '', orderId: '', customerId: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await exService.getAll({
        trangthai: filters.status || undefined,
        madonhang: filters.orderId || undefined,
        makhachhang: filters.customerId || undefined,
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Khong the tai danh sach doi hang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.status, filters.orderId, filters.customerId]);

  const run = async (action, targetStatus) => {
    try {
      const result = await action();
      await load();
      const nextStatus = targetStatus || result?.trangThai || result?.trangthai;
      if (nextStatus) {
        const meta = getStatusMeta(nextStatus);
        setFilters((prev) => ({ ...prev, status: meta.label }));
      }
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message || 'Co loi xay ra');
    }
  };

  const openDialog = (type, item) => setDialog({ type, item });
  const closeDialog = () => setDialog(null);

  const submitDialog = async (event) => {
    event.preventDefault();
    if (!dialog) return;
    const form = new FormData(event.currentTarget);
    if (dialog.type === 'accept') {
      await run(() => exService.accept(dialog.item.maDoiHang || dialog.item.id, form.get('address'), form.get('note')), 'DA_DUYET_CHO_GUI_HANG_CU');
    } else if (dialog.type === 'reject') {
      await run(() => exService.reject(dialog.item.maDoiHang || dialog.item.id, form.get('reason')), 'TU_CHOI');
    }
    closeDialog();
  };

  const statusActions = (item, statusKey) => {
    const id = item.maDoiHang || item.id;
    const button = (label, action, tone = 'primary') => (
      <button
        key={label}
        type="button"
        onClick={action}
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
          tone === 'primary'
            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : tone === 'danger'
            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
            : tone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : tone === 'indigo'
            ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
        }`}
      >
        {label}
      </button>
    );

    switch (statusKey) {
      case 'CHO_DUYET':
        return [
          button('Duyet', () => openDialog('accept', item), 'primary'),
          button('Tu choi', () => openDialog('reject', item), 'danger'),
        ];
      case 'DA_DUYET_CHO_GUI_HANG_CU':
        return [button('Da nhan hang cu', () => run(() => exService.markReceivedOld(id), 'DA_NHAN_HANG_CU_CHO_KIEM_TRA'), 'neutral')];
      case 'DA_NHAN_HANG_CU_CHO_KIEM_TRA':
        return [
          button('Hop le', () => run(() => exService.markValid(id), 'CHO_TAO_DON_MOI'), 'success'),
          button('Khong hop le', () => run(() => exService.markInvalid(id, 'Khong hop le'), 'KHONG_HOP_LE'), 'danger'),
        ];
      case 'CHO_TAO_DON_MOI':
        return [button('Tao don moi', () => run(() => exService.createNewOrder(id), 'DANG_GIAO_HANG_MOI'), 'primary')];
      case 'DANG_GIAO_HANG_MOI':
        return [
          button('Hoan tat', () => run(() => exService.complete(id), 'DA_DOI_XONG'), 'success'),
          button('Dong bo', () => run(() => exService.syncComplete(id), 'DA_DOI_XONG'), 'indigo'),
        ];
      default:
        return [];
    }
  };

  const countsByStatus = useMemo(() => {
    const counts = {};
    items.forEach((item) => {
      const meta = getStatusMeta(item.trangThai);
      counts[meta.key] = (counts[meta.key] || 0) + 1;
    });
    return counts;
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600">
          <Package size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doi hang</h1>
          <p className="mt-1 text-sm text-gray-500">Theo doi va xu ly cac yeu cau doi hang</p>
        </div>
      </header>

      <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
        {STATUS_OPTIONS.map((option) => {
          const isActive = filters.status === option.label;
          const colors = option.colors;
          return (
            <button
