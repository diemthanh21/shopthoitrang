import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import exService from '../services/doihangService';

const STATUS_DEFINITIONS = [
  { key: 'CHO_DUYET', value: 'Chờ duyệt', chip: 'bg-amber-50 text-amber-700 border-amber-200', card: 'lg:border-l-4 border-amber-300' },
  { key: 'DA_DUYET_CHO_GUI_HANG_CU', value: 'Đã duyệt - Chờ gửi hàng cũ', chip: 'bg-blue-50 text-blue-700 border-blue-200', card: 'lg:border-l-4 border-blue-300' },
  { key: 'DA_NHAN_HANG_CU_CHO_KIEM_TRA', value: 'Đã nhận hàng cũ - Chờ kiểm tra', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200', card: 'lg:border-l-4 border-indigo-300' },
  { key: 'KHONG_HOP_LE', value: 'Khách hàng không hợp lệ', chip: 'bg-rose-50 text-rose-700 border-rose-200', card: 'lg:border-l-4 border-rose-300' },
  { key: 'CHO_TAO_DON_MOI', value: 'Chờ tạo đơn mới', chip: 'bg-slate-50 text-slate-700 border-slate-200', card: 'lg:border-l-4 border-slate-300' },
  { key: 'DANG_GIAO_HANG_MOI', value: 'Đang giao hàng mới', chip: 'bg-cyan-50 text-cyan-700 border-cyan-200', card: 'lg:border-l-4 border-cyan-300' },
  { key: 'DA_DOI_XONG', value: 'Đã đổi xong', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', card: 'lg:border-l-4 border-emerald-300' },
  { key: 'TU_CHOI', value: 'Từ chối', chip: 'bg-red-50 text-red-700 border-red-200', card: 'lg:border-l-4 border-red-300' },
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
    .replace(/^_|_$/g, '')
    .toUpperCase();
};

const getStatusMeta = (value) => {
  if (!value) return { key: '', label: 'Không xác định', chip: 'bg-gray-50 text-gray-600 border-gray-200', card: 'lg:border-l-4 border-gray-200' };
  if (STATUS_BY_VALUE[value]) return STATUS_BY_VALUE[value];
  const slug = slugStatus(value);
  if (STATUS_BY_KEY[slug]) return STATUS_BY_KEY[slug];
  return { key: slug, label: value, chip: 'bg-gray-50 text-gray-600 border-gray-200', card: 'lg:border-l-4 border-gray-200' };
};

const formatDate = (value, withTime = true) => {
  if (!value) return '';
  const date = new Date(value);
  return withTime
    ? date.toLocaleString('vi-VN', { hour12: false })
    : date.toLocaleDateString('vi-VN');
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '';
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
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  neutral: 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
};

export default function DoiHangPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null); // {type:'accept'|'reject', id, item}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.trangthai, filters.madonhang, filters.makhachhang]);

  const run = async (fn) => {
    try {
      await fn();
      await load();
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message || 'Lỗi xảy ra');
    }
  };

  const openDialog = (type, item) => setDialog({ type, id: item.maDoiHang || item.id, item });
  const closeDialog = () => setDialog(null);
  const submitDialog = async (e) => {
    e.preventDefault();
    if (!dialog) return;
    const fd = new FormData(e.currentTarget);
    if (dialog.type === 'accept') {
      await run(() => exService.accept(dialog.id, fd.get('diachi'), fd.get('huongdan')));
    } else if (dialog.type === 'reject') {
      await run(() => exService.reject(dialog.id, fd.get('lydo')));
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
        className={`px-3 py-1.5 text-xs font-medium rounded border transition ${ACTION_STYLES[tone]}`}
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Đổi hàng</h1>
          <p className="text-sm text-gray-500">Theo dõi và xử lý các yêu cầu đổi hàng của khách.</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        >
          Làm mới
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50/40 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-[160px] flex-col text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <span className="mb-1">Đơn gốc</span>
            <input
              className="h-9 w-full rounded-lg border border-white/0 bg-white px-3 text-sm text-slate-800 shadow-inner shadow-slate-100 outline-none ring-1 ring-transparent focus:border-sky-300 focus:ring-sky-200"
              placeholder="Ví dụ: 112"
              value={filters.madonhang}
              onChange={(e) => setFilters((v) => ({ ...v, madonhang: e.target.value }))}
            />
          </label>
          <label className="flex min-w-[160px] flex-col text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <span className="mb-1">Khách hàng</span>
            <input
              className="h-9 w-full rounded-lg border border-white/0 bg-white px-3 text-sm text-slate-800 shadow-inner shadow-slate-100 outline-none ring-1 ring-transparent focus:border-indigo-300 focus:ring-indigo-200"
              placeholder="Mã khách"
              value={filters.makhachhang}
              onChange={(e) => setFilters((v) => ({ ...v, makhachhang: e.target.value }))}
            />
          </label>
          <label className="flex min-w-[180px] flex-col text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <span className="mb-1">Trạng thái</span>
            <select
              className="h-9 w-full rounded-lg border border-white/0 bg-white px-3 text-sm text-slate-800 shadow-inner shadow-slate-100 outline-none ring-1 ring-transparent focus:border-violet-300 focus:ring-violet-200"
              value={filters.trangthai}
              onChange={(e) => setFilters((v) => ({ ...v, trangthai: e.target.value }))}
            >
              <option value="">Tất cả</option>
              {STATUS_DEFINITIONS.map((opt) => (
                <option key={opt.key} value={opt.value}>
                  {opt.value}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm hover:bg-slate-50"
          >
            Xóa lọc
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-gray-500">
          Đang tải dữ liệu...
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-gray-500">
          Không có yêu cầu đổi hàng nào khớp bộ lọc.
        </div>
      ) : (
        <div className="space-y-5">
          {list.map((item) => {
            const statusMeta = getStatusMeta(item.trangThai);
            const actions = statusActions(item, statusMeta.key);
            return (
              <div
                key={item.maDoiHang || item.id}
                className={`rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-lg ${statusMeta.card}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Phiếu đổi</p>
                    <p className="text-2xl font-semibold text-slate-900">DH-{item.maDoiHang || item.id}</p>
                    <p className="text-xs text-slate-500">Tạo: {formatDate(item.ngayYeuCau)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${statusMeta.chip}`}
                    >
                      {statusMeta.label}
                    </span>
                    <Link
                      to={`/doihang/${item.maDoiHang || item.id}`}
                      className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                      Xem chi tiết →
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 px-4 py-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Đơn & khách</p>
                    <p className="text-sm text-slate-700">
                      Đơn gốc: <span className="font-semibold text-slate-900">#{item.maDonHang}</span>
                    </p>
                    <p className="text-sm text-slate-700">
                      Khách: <span className="font-semibold text-slate-900">KH{item.maKhachHang}</span>
                    </p>
                    {item.maDonHangMoi && (
                      <p className="text-sm text-slate-700">
                        Đơn mới: <span className="font-semibold text-slate-900">#{item.maDonHangMoi}</span>
                      </p>
                    )}
                    <p className="mt-3 text-xs text-slate-500">
                      Địa chỉ gửi hàng cũ: <span className="font-medium text-slate-700">{item.diaChiGuiHangCu || ''}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sản phẩm đổi</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {describeVariant(item.variantMoi, item.maChiTietSanPhamMoi)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Từ: <span className="font-medium text-slate-700">{describeVariant(item.variantCu, item.maChiTietSanPhamCu)}</span>
                    </p>
                    <p className="mt-2 text-xs text-slate-500">Hướng dẫn: {item.huongDanDongGoi || ''}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Giá & số lượng</p>
                    <p className="text-sm text-slate-700">
                      SL cần đổi: <span className="font-semibold text-slate-900">{item.soLuong}</span>
                    </p>
                    <p className="text-sm text-slate-700">Giá cũ: {formatCurrency(item.giacu)}</p>
                    <p className="text-sm text-slate-700">Giá mới: {formatCurrency(item.giamoi)}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-900">
                      Chênh lệch: <span className="text-emerald-600">{formatCurrency(item.chenhlech)}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tiến trình xử lý</p>
                    <p className="text-sm text-slate-700">Ngày duyệt: {formatDate(item.ngayDuyet, false)}</p>
                    <p className="text-sm text-slate-700">Ngày nhận hàng cũ: {formatDate(item.ngayNhanHangCu, false)}</p>
                    <p className="text-sm text-slate-700">Ngày kiểm tra: {formatDate(item.ngayKiemTra, false)}</p>
                    {item.trangThaiKiemTra && (
                      <p className="text-xs text-slate-500">Kết quả kiểm tra: {item.trangThaiKiemTra}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                  <div className="text-sm text-slate-600">
                    {item.lyDo ? (
                      <span>
                        Lý do khách: <strong className="text-slate-900">{item.lyDo}</strong>
                      </span>
                    ) : (
                      'Khách không ghi lý do.'
                    )}
                    {item.ghiChu && (
                      <span className="ml-2 text-xs text-slate-500">Ghi chú nội bộ: {item.ghiChu}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {actions.length ? actions : (
                      <span className="text-xs text-gray-400">Không có hành động khả dụng.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={closeDialog} />
      <form
        onSubmit={submitDialog}
        className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-2xl"
      >
        <p className="text-xs uppercase tracking-wide text-gray-400">{metaLine}</p>
        <h3 className="mt-1 text-lg font-semibold text-gray-900">{title}</h3>

        {isAccept ? (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Địa chỉ khách cần gửi hàng cũ
              <input
                name="diachi"
                required
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                placeholder="VD: Kho Hà Nội, 123 Trần Duy Hưng"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Hướng dẫn đóng gói (tùy chọn)
              <input
                name="huongdan"
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                placeholder="Ghi rõ tình trạng, phụ kiện kèm theo..."
              />
            </label>
          </div>
        ) : (
          <label className="mt-4 block text-sm font-medium text-gray-700">
            Lý do từ chối
            <input
              name="lydo"
              required
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="Nhập lý do cụ thể"
            />
          </label>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={closeDialog}
            className="rounded border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Xác nhận
          </button>
        </div>
      </form>
    </div>
  );
}
