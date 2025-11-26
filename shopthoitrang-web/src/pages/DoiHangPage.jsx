import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, RefreshCcw, Search, Package } from 'lucide-react';
import exService from '../services/doihangService';

const STATUS_DEFINITIONS = [
  { key: 'CHO_DUYET', value: 'Chờ duyệt', chip: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'DA_DUYET_CHO_GUI_HANG_CU', value: 'Đã duyệt - Chờ gửi hàng cũ', chip: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'DA_NHAN_HANG_CU_CHO_KIEM_TRA', value: 'Đã nhận hàng cũ - Chờ kiểm tra', chip: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'KHONG_HOP_LE', value: 'Khách hàng không hợp lệ', chip: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'CHO_TAO_DON_MOI', value: 'Chờ tạo đơn mới', chip: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'DANG_GIAO_HANG_MOI', value: 'Đang giao hàng mới', chip: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'DA_DOI_XONG', value: 'Đã đổi xong', chip: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'TU_CHOI', value: 'Từ chối', chip: 'bg-red-100 text-red-700 border-red-200' },
];

const STATUS_BY_KEY = STATUS_DEFINITIONS.reduce((acc, cur) => ({ ...acc, [cur.key]: cur }), {});
const STATUS_BY_VALUE = STATUS_DEFINITIONS.reduce((acc, cur) => ({ ...acc, [cur.value]: cur }), {});

const slugStatus = (value) => {
  if (!value) return '';
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
};

const getStatusMeta = (value) => {
  if (!value) return { key: '', label: 'Không xác định', chip: 'bg-gray-100 text-gray-600 border-gray-200' };
  if (STATUS_BY_VALUE[value]) return STATUS_BY_VALUE[value];
  const slug = slugStatus(value);
  if (STATUS_BY_KEY[slug]) return STATUS_BY_KEY[slug];
  return { key: slug, label: value, chip: 'bg-gray-100 text-gray-600 border-gray-200' };
};

const formatDate = (value, withTime = true) => {
  if (!value) return '-';
  const date = new Date(value);
  return withTime
    ? date.toLocaleString('vi-VN', { hour12: false })
    : date.toLocaleDateString('vi-VN');
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toLocaleString('vi-VN')}đ`;
};

const describeVariant = (variant, fallbackId) => {
  if (!variant) return fallbackId ? `Biến thể ${fallbackId}` : 'Không rõ sản phẩm';
  const attrs = [variant.size, variant.color].filter(Boolean).join(' • ');
  const name = variant.productName || (fallbackId ? `Biến thể ${fallbackId}` : null);
  return [name, attrs].filter(Boolean).join(' · ') || `Biến thể ${variant.id}`;
};

const ACTION_STYLES = {
  primary: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  success: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  neutral: 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
};

export default function DoiHangPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState({ trangthai: '', madonhang: '', makhachhang: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await exService.getAll({
        trangthai: filters.trangthai || undefined,
        madonhang: filters.madonhang || undefined,
        makhachhang: filters.makhachhang || undefined,
      });
      setList(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Không thể tải danh sách đổi hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.trangthai, filters.madonhang, filters.makhachhang]);

  const run = async (fn, targetStatusHint) => {
    try {
      const result = await fn();
      await load();
      const targetStatus = targetStatusHint || result?.trangThai || result?.trangthai;
      if (targetStatus) {
        const meta = getStatusMeta(targetStatus);
        if (meta?.value || meta?.label) {
          setFilters((prev) => ({ ...prev, trangthai: meta.value || meta.label }));
        }
      }
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message || 'L?i x?y ra');
    }
  };

  const openDialog = (type, item) => setDialog({ type, id: item.maDoiHang || item.id, item });
  const closeDialog = () => setDialog(null);
  const submitDialog = async (e) => {
    e.preventDefault();
    if (!dialog) return;
    const fd = new FormData(e.currentTarget);
    if (dialog.type === 'accept') {
      await run(() => exService.accept(dialog.id, fd.get('diachi'), fd.get('huongdan')), 'DA_DUYET_CHO_GUI_HANG_CU');
    } else if (dialog.type === 'reject') {
      await run(() => exService.reject(dialog.id, fd.get('lydo')), 'TU_CHOI');
    }
    closeDialog();
  };

  const statusActions = (item, statusKey) => {
    const id = item.maDoiHang || item.id;
    const button = (label, onClick, tone = 'primary') => (
      <button
        key={label}
        type="button"
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${ACTION_STYLES[tone]}`}
      >
        {label}
      </button>
    );

    switch (statusKey) {
      case 'CHO_DUYET':
        return [
          button('Duyệt', () => openDialog('accept', item), 'primary'),
          button('Từ chối', () => openDialog('reject', item), 'danger'),
        ];
      case 'DA_DUYET_CHO_GUI_HANG_CU':
        return [button('Đã nhận hàng cũ', () => run(() => exService.markReceivedOld(id)), 'neutral')];
      case 'DA_NHAN_HANG_CU_CHO_KIEM_TRA':
        return [
          button('Hợp lệ', () => run(() => exService.markValid(id)), 'success'),
          button('Không hợp lệ', () => run(() => exService.markInvalid(id, 'Rách / đã sử dụng')), 'danger'),
        ];
      case 'CHO_TAO_DON_MOI':
        return [button('Tạo đơn mới', () => run(() => exService.createNewOrder(id)), 'primary')];
      case 'DANG_GIAO_HANG_MOI':
        return [
          button('Hoàn tất', () => run(() => exService.complete(id)), 'success'),
          button('Đồng bộ hoàn tất', () => run(() => exService.syncComplete(id)), 'indigo'),
        ];
      default:
        return [];
    }
  };

  const clearFilters = () => setFilters({ trangthai: '', madonhang: '', makhachhang: '' });

  // Count items by status
  const counts = {};
  list.forEach((item) => {
    const meta = getStatusMeta(item.trangThai);
    counts[meta.key] = (counts[meta.key] || 0) + 1;
  });
  counts.total = list.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600">
            <Package size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đổi hàng</h1>
            <p className="mt-1 text-sm text-gray-500">Theo dõi và xử lý các yêu cầu đổi hàng của khách</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
       

        {STATUS_DEFINITIONS.map((status) => {
          const isActive = filters.trangthai === status.value;
          const colorMap = {
            CHO_DUYET: { dot: "bg-yellow-400", activeBg: "border-yellow-500 bg-yellow-500", inactiveBg: "border-yellow-200 bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100" },
            DA_DUYET_CHO_GUI_HANG_CU: { dot: "bg-blue-400", activeBg: "border-blue-500 bg-blue-500", inactiveBg: "border-blue-200 bg-blue-50", text: "text-blue-700", badge: "bg-blue-100" },
            DA_NHAN_HANG_CU_CHO_KIEM_TRA: { dot: "bg-indigo-400", activeBg: "border-indigo-500 bg-indigo-500", inactiveBg: "border-indigo-200 bg-indigo-50", text: "text-indigo-700", badge: "bg-indigo-100" },
            KHONG_HOP_LE: { dot: "bg-rose-400", activeBg: "border-rose-500 bg-rose-500", inactiveBg: "border-rose-200 bg-rose-50", text: "text-rose-700", badge: "bg-rose-100" },
            CHO_TAO_DON_MOI: { dot: "bg-slate-400", activeBg: "border-slate-500 bg-slate-500", inactiveBg: "border-slate-200 bg-slate-50", text: "text-slate-700", badge: "bg-slate-100" },
            DANG_GIAO_HANG_MOI: { dot: "bg-cyan-400", activeBg: "border-cyan-500 bg-cyan-500", inactiveBg: "border-cyan-200 bg-cyan-50", text: "text-cyan-700", badge: "bg-cyan-100" },
            DA_DOI_XONG: { dot: "bg-green-400", activeBg: "border-green-500 bg-green-500", inactiveBg: "border-green-200 bg-green-50", text: "text-green-700", badge: "bg-green-100" },
            TU_CHOI: { dot: "bg-red-400", activeBg: "border-red-500 bg-red-500", inactiveBg: "border-red-200 bg-red-50", text: "text-red-700", badge: "bg-red-100" },
          };
          const colors = colorMap[status.key] || { dot: "bg-gray-400", activeBg: "border-gray-500 bg-gray-500", inactiveBg: "border-gray-200 bg-gray-50", text: "text-gray-700", badge: "bg-gray-100" };

          return (
            <button
              key={status.key}
              onClick={() => setFilters((prev) => ({ ...prev, trangthai: status.value }))}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? `${colors.activeBg} text-white shadow-sm`
                  : `${colors.inactiveBg} ${colors.text} hover:shadow-sm`
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${isActive ? "bg-white" : colors.dot}`}></div>
              <span>{status.value}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                isActive ? "bg-white/20 text-white" : `${colors.badge} text-gray-700`
              }`}>
                {counts[status.key] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.madonhang}
            onChange={(e) => setFilters((v) => ({ ...v, madonhang: e.target.value }))}
            placeholder="Tìm theo mã đơn gốc..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <input
          value={filters.makhachhang}
          onChange={(e) => setFilters((v) => ({ ...v, makhachhang: e.target.value }))}
          placeholder="Mã khách hàng..."
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-48"
        />
        <select
          value={filters.trangthai}
          onChange={(e) => setFilters((v) => ({ ...v, trangthai: e.target.value }))}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-64"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_DEFINITIONS.map((opt) => (
            <option key={opt.key} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Xóa lọc
        </button>
        <button
          onClick={load}
          className="flex items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <RefreshCcw size={16} /> Làm mới
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="rounded-xl bg-white px-4 py-12 text-center text-gray-500 shadow-sm">
          ?ang t?i d? li?u...
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl bg-white px-4 py-12 text-center text-gray-500 shadow-sm">
          Kh?ng c? y?u c?u ??i h?ng n?o kh?p b? l?c.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">M? phi?u</th>
                  <th className="px-4 py-3 text-left">M? ??n</th>
                  <th className="px-4 py-3 text-left">M? KH</th>
                  <th className="px-4 py-3 text-left">S?n ph?m</th>
                  <th className="px-4 py-3 text-left">L? do</th>
                  <th className="px-4 py-3 text-left">Tr?ng th?i</th>
                  <th className="px-4 py-3 text-left">Ng?y y?u c?u</th>
                  <th className="px-4 py-3 text-left">Thao t?c</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((item) => {
                  const statusMeta = getStatusMeta(item.trangThai);
                  const actions = statusActions(item, statusMeta.key);
                  return (
                    <tr key={item.maDoiHang || item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">DH-{item.maDoiHang || item.id}</td>
                      <td className="px-4 py-3">#{item.maDonHang || '?'}</td>
                      <td className="px-4 py-3">KH{item.maKhachHang || '?'}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{describeVariant(item.variantMoi, item.maChiTietSanPhamMoi)}</p>
                        <p className="text-xs text-gray-500">T?: {describeVariant(item.variantCu, item.maChiTietSanPhamCu)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="line-clamp-2 text-xs text-gray-600">{item.lyDo || '?'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusMeta.chip}`}>{statusMeta.label}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.ngayYeuCau)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <Link
                            to={`/doihang/${item.maDoiHang || item.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            Xem chi ti?t <ArrowUpRight size={14} />
                          </Link>
                          {actions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">{actions}</div>
                          ) : (
                            <span className="text-xs text-gray-400">Kh?ng c? h?nh ??ng</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ExchangeDialogs dialog={dialog} closeDialog={closeDialog} submitDialog={submitDialog} />
    </div>
  );
}

export function ExchangeDialogs({ dialog, closeDialog, submitDialog }) {
  if (!dialog) return null;
  const isAccept = dialog.type === 'accept';
  const title = isAccept ? 'Duyệt yêu cầu đổi hàng' : 'Từ chối yêu cầu đổi hàng';
  const metaLine = dialog.item
    ? `Phiếu DH-${dialog.item.maDoiHang || dialog.item.id} · Đơn gốc #${dialog.item.maDonHang}`
    : `Phiếu DH-${dialog.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <form
        onSubmit={submitDialog}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase text-blue-600">{metaLine}</p>
          <h3 className="mt-1 text-xl font-bold text-gray-900">{title}</h3>
        </div>

        {isAccept ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Địa chỉ khách cần gửi hàng cũ
              <input
                name="diachi"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="VD: Kho Hà Nội, 123 Trần Duy Hưng"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Hướng dẫn đóng gói (tùy chọn)
              <input
                name="huongdan"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Ghi rõ tình trạng, phụ kiện kèm theo..."
              />
            </label>
          </div>
        ) : (
          <label className="block text-sm font-medium text-gray-700">
            Lý do từ chối
            <textarea
              name="lydo"
              required
              className="mt-1 min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Nhập lý do cụ thể"
            />
          </label>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              isAccept ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Xác nhận
          </button>
        </div>
      </form>
    </div>
  );
}