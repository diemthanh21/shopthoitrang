import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import exService from '../services/doihangService';

const STATUS_DEFINITIONS = [
  { key: 'CHO_DUYET', value: 'Chờ duyệt', chip: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'DA_DUYET_CHO_GUI_HANG_CU', value: 'Đã duyệt - chờ gửi hàng cũ', chip: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'DA_NHAN_HANG_CU_CHO_KIEM_TRA', value: 'Đã nhận hàng cũ - chờ kiểm tra', chip: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'DU_DIEU_KIEN_XU_LY_CHENH_LECH', value: 'Đủ điều kiện xử lý chênh lệch', chip: 'bg-teal-100 text-teal-700 border-teal-200' },
  { key: 'DA_XU_LY_CHENH_LECH_CHO_TAO_DON', value: 'Đã xử lý chênh lệch - chờ tạo đơn', chip: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'CHO_TAO_DON_MOI', value: 'Chờ tạo đơn mới', chip: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'DANG_GIAO_HANG_MOI', value: 'Đang giao hàng mới', chip: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'DA_TAO_DON_MOI_DANG_GIAO', value: 'Đơn mới đang giao', chip: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'DA_DOI_XONG', value: 'Đã đổi xong', chip: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'KHONG_HOP_LE', value: 'Không hợp lệ', chip: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'TU_CHOI', value: 'Từ chối', chip: 'bg-red-100 text-red-700 border-red-200' },
];

const STATUS_BY_KEY = STATUS_DEFINITIONS.reduce((acc, cur) => ({ ...acc, [cur.key]: cur }), {});
const STATUS_BY_VALUE = STATUS_DEFINITIONS.reduce((acc, cur) => ({ ...acc, [cur.value]: cur }), {});

const slugStatus = (value) => {
  if (!value) return '';
  return value.toString().trim().toUpperCase().replace(/\s+/g, '_');
};

const getStatusMeta = (value) => {
  if (!value) return { key: '', label: 'Không xác định', chip: 'bg-gray-100 text-gray-600 border-gray-200' };
  if (STATUS_BY_VALUE[value]) return STATUS_BY_VALUE[value];
  const slug = slugStatus(value);
  if (STATUS_BY_KEY[slug]) return STATUS_BY_KEY[slug];
  return { key: slug, label: value, chip: 'bg-gray-100 text-gray-600 border-gray-200' };
};

const formatDateTime = (value, withTime = true) => {
  if (!value) return '-';
  const d = new Date(value);
  return withTime ? d.toLocaleString('vi-VN', { hour12: false }) : d.toLocaleDateString('vi-VN');
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toLocaleString('vi-VN')} ₫`;
};

const describeVariant = (variant, fallbackId) => {
  if (!variant) return fallbackId ? `Biến thể ${fallbackId}` : 'Không rõ sản phẩm';
  const attrs = [variant.color, variant.size].filter(Boolean).join(' - ');
  const base = variant.productName || (fallbackId ? `Biến thể ${fallbackId}` : null);
  return [base, attrs].filter(Boolean).join(' | ') || `Biến thể ${variant.id}`;
};

const Section = ({ title, children }) => (
  <div className="rounded-2xl bg-white shadow-sm">
    <div className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
    <div className="p-4 text-sm text-gray-700">{children}</div>
  </div>
);

const EvidenceLink = ({ label, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
  >
    {label}
  </a>
);

export default function DoiHangDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [logs, setLogs] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await exService.getById(id);
      setItem(data);
      setLogs(await exService.getLogs(id));
      setPreview(await exService.diffPreview(id));
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const details = useMemo(() => {
    if (!item) return [];
    if (Array.isArray(item.items) && item.items.length) return item.items;
    return [{
      maChiTietSanPhamCu: item.maChiTietSanPhamCu,
      maChiTietSanPhamMoi: item.maChiTietSanPhamMoi,
      soLuong: item.soLuong,
      lyDo: item.lyDo,
      variantCu: item.variantCu,
      variantMoi: item.variantMoi,
      evidence: item.ghiChu,
    }].filter((d) => d.maChiTietSanPhamCu || d.maChiTietSanPhamMoi);
  }, [item]);

  const attachments = useMemo(() => {
    if (!item) return [];
    if (Array.isArray(item.attachments) && item.attachments.length) return item.attachments;
    return details.flatMap((detail, idx) => {
      const ev = detail.evidence;
      if (!ev || typeof ev !== 'object') return [];
      const list = [];
      if (ev.imageEvidence) {
        list.push({ label: `Anh #${idx + 1}`, url: ev.imageEvidence });
      }
      if (ev.videoEvidence) {
        list.push({ label: `Video #${idx + 1}`, url: ev.videoEvidence });
      }
      return list;
    });
  }, [details, item]);

  if (loading) return <div className="p-4 text-sm text-gray-600">Dang tai...</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;
  if (!item) return <div className="p-4">Khong tim thay phieu.</div>;

  const statusMeta = getStatusMeta(item.trangThai);

  return (
    <div className="space-y-5 p-4">
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-xs text-gray-500">Phieu doi</p>
            <h1 className="text-2xl font-semibold text-gray-900">DH-{item.maDoiHang || item.id}</h1>
            <p className="text-xs text-gray-500">{formatDateTime(item.ngayYeuCau)}</p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${statusMeta.chip}`}>
            {statusMeta.label}
          </span>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw size={14} /> Tai lai
          </button>
        </div>
        <div className="grid gap-4 p-4 text-sm text-gray-700 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-gray-500">Thong tin chinh</p>
            <p>Don goc: <span className="font-semibold">#{item.maDonHang}</span></p>
            <p>Khach: <span className="font-semibold">{item.maKhachHang ? `KH${item.maKhachHang}` : '-'}</span></p>
            <p>Ly do: {item.lyDo || '-'}</p>
            <p>Ghi chu: {item.ghiChu || '-'}</p>
          </div>
          <div>
          
            <p>Trang thai tien: {item.trangThaiTien || '-'}</p>
            <p>Phuong thuc xu ly: {item.phuongThucXuLyChenhLech || '-'}</p>
            <p>Voucher: {item.voucherCode ? `${item.voucherCode} (-${formatCurrency(item.voucherAmount)})` : '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Tien trinh</p>
            <p>Ngay duyet: {formatDateTime(item.ngayDuyet)}</p>
            <p>Ngay nhan hang cu: {formatDateTime(item.ngayNhanHangCu)}</p>
            <p>Ngay kiem tra: {formatDateTime(item.ngayKiemTra)}</p>
            <p>Ket qua: {item.trangThaiKiemTra || '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Don moi</p>
            <p>Ma don moi: {item.maDonHangMoi || '-'}</p>
            <p>Ngay tao don moi: {formatDateTime(item.ngayTaoDonMoi || item.ngaytaodonmoi)}</p>
          </div>
        </div>
      </div>

      <Section title="San pham doi">
        <div className="space-y-3">
          {details.map((detail, idx) => {
            const ev = detail.evidence && typeof detail.evidence === 'object' ? detail.evidence : null;
            return (
              <div key={`${detail.maChiTietSanPhamCu}-${idx}`} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Dong #{idx + 1}</span>
                  <span>So luong: {detail.soLuong || 0}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-900">{describeVariant(detail.variantCu, detail.maChiTietSanPhamCu)}</p>
                <p className="text-sm text-gray-700">- {describeVariant(detail.variantMoi, detail.maChiTietSanPhamMoi)}</p>
                {detail.lyDo && <p className="text-xs text-gray-500">Lý do: {detail.lyDo}</p>}
             
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Minh chung tai len">
        {attachments.length ? (
          <div className="flex flex-wrap gap-2">
            {attachments.map((link, idx) => (
              <EvidenceLink key={`${link.url}-${idx}`} label={link.label || 'Minh chung'} url={link.url} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Chua co minh chung</p>
        )}
      </Section>

      <Section title="Huong dan & giao nhan">
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Dia chi gui hang cu</p>
            <p className="font-semibold text-gray-900">{item.diaChiGuiHangCu || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Huong dan dong goi</p>
            <p className="text-gray-900">{item.huongDanDongGoi || '-'}</p>
          </div>
        </div>
      </Section>

     

      <Section title="Timeline">
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">Chua co log</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-gray-600">
              <thead>
                <tr>
                  <th className="px-2 py-1">Hanh dong</th>
                  <th className="px-2 py-1">Tu</th>
                  <th className="px-2 py-1">Den</th>
                  <th className="px-2 py-1">Ghi chu</th>
                  <th className="px-2 py-1">Thoi gian</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={log.id || idx} className="border-t border-gray-100">
                    <td className="px-2 py-1 font-medium text-gray-800">{log.action}</td>
                    <td className="px-2 py-1">{log.from_status || '-'}</td>
                    <td className="px-2 py-1">{log.to_status || '-'}</td>
                    <td className="px-2 py-1">{log.note || '-'}</td>
                    <td className="px-2 py-1">{formatDateTime(log.created_at || log.thoigian)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="flex items-center gap-3">
        <Link to="/doihang" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
          <ArrowLeft size={14} /> Quay lai danh sach
        </Link>
      </div>
    </div>
  );
}
