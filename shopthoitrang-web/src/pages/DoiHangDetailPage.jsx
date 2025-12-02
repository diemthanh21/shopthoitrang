import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, ClipboardList, Package2, PiggyBank, Clock3, ArrowRightLeft, FileText, Image, Video, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import exService from '../services/doihangService';
import staffService from '../services/taikhoannhanvienService';

const STATUS_DEFINITIONS = [
  { key: 'CHO_DUYET', value: 'Chờ duyệt', chip: 'bg-amber-500', icon: AlertCircle },
  { key: 'DA_DUYET_CHO_GUI_HANG_CU', value: 'Đã duyệt - chờ gửi hàng cũ', chip: 'bg-blue-500', icon: Package2 },
  { key: 'DA_NHAN_HANG_CU_CHO_KIEM_TRA', value: 'Đã nhận hàng cũ - chờ kiểm tra', chip: 'bg-indigo-500', icon: ClipboardList },
  { key: 'DU_DIEU_KIEN_XU_LY_CHENH_LECH', value: 'Đủ điều kiện xử lý chênh lệch', chip: 'bg-teal-500', icon: CheckCircle2 },
  { key: 'DA_XU_LY_CHENH_LECH_CHO_TAO_DON', value: 'Đã xử lý chênh lệch - chờ tạo đơn', chip: 'bg-slate-500', icon: FileText },
  { key: 'CHO_TAO_DON_MOI', value: 'Chờ tạo đơn mới', chip: 'bg-slate-500', icon: Clock3 },
  { key: 'DANG_GIAO_HANG_MOI', value: 'Đang giao hàng mới', chip: 'bg-cyan-500', icon: Package2 },
  { key: 'DA_TAO_DON_MOI_DANG_GIAO', value: 'Đơn mới đang giao', chip: 'bg-cyan-500', icon: Package2 },
  { key: 'DA_DOI_XONG', value: 'Đã đổi xong', chip: 'bg-emerald-500', icon: CheckCircle2 },
  { key: 'KHONG_HOP_LE', value: 'Không hợp lệ', chip: 'bg-rose-500', icon: XCircle },
  { key: 'TU_CHOI', value: 'Từ chối', chip: 'bg-red-600', icon: XCircle },
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
  if (!value) return { key: '', label: 'Không xác định', chip: 'bg-gray-400', icon: AlertCircle };
  if (STATUS_BY_VALUE[value]) return STATUS_BY_VALUE[value];
  const slug = slugStatus(value);
  if (STATUS_BY_KEY[slug]) return STATUS_BY_KEY[slug];
  return { key: slug, label: value, chip: 'bg-gray-400', icon: AlertCircle };
};

const formatDateTime = (value, withTime = true) => {
  if (!value) return '-';
  const d = new Date(value);
  return withTime ? d.toLocaleString('vi-VN', { hour12: false }) : d.toLocaleDateString('vi-VN');
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toLocaleString('vi-VN')} đ`;
};

const describeVariant = (variant, fallbackId) => {
  if (!variant) return fallbackId ? `Biến thể ${fallbackId}` : 'Không rõ sản phẩm';
  const attrs = [variant.color, variant.size].filter(Boolean).join(' - ');
  const base = variant.productName || (fallbackId ? `Biến thể ${fallbackId}` : null);
  return [base, attrs].filter(Boolean).join(' | ') || `Biến thể ${variant.id}`;
};

export default function DoiHangDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [logs, setLogs] = useState([]);
  const [actorNames, setActorNames] = useState({});
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await exService.getById(id);
      const logData = await exService.getLogs(id);
      setItem(data);
      setLogs(logData);
      setActorNames(await resolveActorNames(logData));
      setPreview(await exService.diffPreview(id));
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const resolveActorNames = async (logData) => {
    const staffTypes = ['ADMIN', 'STAFF', 'NHANVIEN'];
    const staffIds = [
      ...new Set(
        logData
          .filter((log) => {
            const type = (log.actor_type || '').toUpperCase();
            return staffTypes.includes(type) && Number(log.actor_id);
          })
          .map((log) => Number(log.actor_id)),
      ),
    ].filter((id) => Number.isFinite(id) && id > 0);

    if (!staffIds.length) return {};

    const entries = await Promise.all(
      staffIds.map(async (staffId) => {
        try {
          const staff = await staffService.getById(staffId);
          const label = staff?.tenDangNhap?.trim() || staff?.maNhanVien || `NV #${staffId}`;
          return [staffId, label];
        } catch (_) {
          return [staffId, `NV #${staffId}`];
        }
      }),
    );

    const map = {};
    entries.forEach(([id, label]) => {
      staffTypes.forEach((type) => {
        map[`${type}_${id}`] = label;
      });
    });
    return map;
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
    const pushMedia = (container, value, labelPrefix) => {
      if (!value) return;
      const arr = Array.isArray(value) ? value : [value];
      arr.forEach((entry, mediaIdx) => {
        if (typeof entry !== 'string') return;
        const url = entry.trim();
        if (!url) return;
        container.push({ label: `${labelPrefix} #${mediaIdx + 1}`, url });
      });
    };
    return details.flatMap((detail, idx) => {
      const ev = detail.evidence;
      if (!ev || typeof ev !== 'object') return [];
      const list = [];
      pushMedia(list, ev.imageEvidence, `Ảnh #${idx + 1}`);
      pushMedia(list, ev.videoEvidence, `Video #${idx + 1}`);
      return list;
    });
  }, [details, item]);

  const getActorLabel = (log) => {
    const type = (log.actor_type || '').toUpperCase();
    const actorId = log.actor_id ? Number(log.actor_id) : null;
    if (!type || type === 'SYSTEM') {
      return 'Hệ thống';
    }

    if (actorId && actorNames[`${type}_${actorId}`]) {
      return actorNames[`${type}_${actorId}`];
    }

    if (type === 'CUSTOMER') {
      return actorId ? `Khách #${actorId}` : 'Khách hàng';
    }

    if (['ADMIN', 'STAFF', 'NHANVIEN'].includes(type)) {
      return actorId ? `NV #${actorId}` : 'Nhân viên';
    }

    return actorId ? `${type} #${actorId}` : type;
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-lg font-semibold text-blue-900">Đang tải...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50 p-4">
      <div className="rounded-lg bg-white p-8 shadow-xl">
        <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <p className="text-center text-lg font-semibold text-red-600">{error}</p>
      </div>
    </div>
  );
  
  if (!item) return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50 p-4">
      <div className="rounded-lg bg-white p-8 shadow-xl">
        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <p className="text-center text-lg font-semibold text-gray-600">Không tìm thấy phiếu</p>
      </div>
    </div>
  );

  const statusMeta = getStatusMeta(item.trangThai);
  const StatusIcon = statusMeta.icon;
  const ImageIcon = Image;

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Phiếu Đổi Hàng #DH-{item.maDoiHang || item.id}</h1>
                <p className="mt-1 text-sm text-blue-100">Ngày tạo: {formatDateTime(item.ngayYeuCau)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-2 rounded-lg ${statusMeta.chip} px-4 py-2 text-sm font-semibold text-white`}>
                  <StatusIcon size={18} />
                  {statusMeta.label}
                </span>
                <button
                  onClick={load}
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  <RefreshCcw size={16} />
                  Tải lại
                </button>
              </div>
            </div>
          </div>

          {/* Thông tin tổng quan - Dạng bảng */}
          <div className="border-t border-blue-100">
            <table className="w-full">
              <tbody className="divide-y divide-blue-100">
                <tr className="hover:bg-blue-50">
                  <td className="px-6 py-4 text-sm font-semibold text-blue-900 w-1/4">
                    <div className="flex items-center gap-2">
                      <Package2 className="h-5 w-5 text-blue-600" />
                      Đơn hàng gốc
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className="font-semibold text-blue-600">#{item.maDonHang || item.donHangId || '---'}</span>
                    <span className="ml-3 text-gray-500">Khách hàng: {item.maKhachHang ? `KH${item.maKhachHang}` : 'Khách lẻ'}</span>
                  </td>
                </tr>
                <tr className="hover:bg-blue-50">
                  <td className="px-6 py-4 text-sm font-semibold text-blue-900">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                      Lý do đổi hàng
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div>{item.lyDo || 'Không cung cấp'}</div>
                    {item.ghiChu && <div className="mt-1 text-xs text-gray-500">{item.ghiChu}</div>}
                  </td>
                </tr>
                <tr className="hover:bg-blue-50">
                  <td className="px-6 py-4 text-sm font-semibold text-blue-900">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="h-5 w-5 text-blue-600" />
                      Trạng thái thanh toán
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div>{item.trangThaiTien || 'Chưa xác định'}</div>
                    {item.phuongThucXuLyChenhLech && (
                      <div className="mt-1 text-xs text-gray-500">Phương thức xử lý: {item.phuongThucXuLyChenhLech}</div>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-blue-50">
                  <td className="px-6 py-4 text-sm font-semibold text-blue-900">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-5 w-5 text-blue-600" />
                      Đơn hàng mới
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div>{item.maDonHangMoi ? `#${item.maDonHangMoi}` : 'Chưa tạo'}</div>
                    {(item.ngayTaoDonMoi || item.ngaytaodonmoi) && (
                      <div className="mt-1 text-xs text-gray-500">Ngày tạo: {formatDateTime(item.ngayTaoDonMoi || item.ngaytaodonmoi)}</div>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-blue-50">
                  <td className="px-6 py-4 text-sm font-semibold text-blue-900">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                      Voucher áp dụng
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div>{item.voucherCode || 'Không áp dụng'}</div>
                    {item.voucherCode && item.voucherAmount && (
                      <div className="mt-1 text-xs text-gray-500">Giảm giá: {formatCurrency(item.voucherAmount)}</div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bảng sản phẩm đổi */}
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="bg-blue-600 px-6 py-3">
            <h2 className="text-lg font-bold text-white">Chi Tiết Sản Phẩm Đổi</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900">Sản phẩm cũ</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-blue-900">
                    <ArrowRightLeft className="inline h-4 w-4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900">Sản phẩm mới</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-blue-900">Số lượng</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900">Lý do</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-blue-900">Minh chứng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {details.map((detail, idx) => {
                  const ev = detail.evidence && typeof detail.evidence === 'object' ? detail.evidence : null;
                  return (
                    <tr key={`${detail.maChiTietSanPhamCu}-${idx}`} className="hover:bg-blue-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="font-medium">{describeVariant(detail.variantCu, detail.maChiTietSanPhamCu)}</div>
                        <div className="text-xs text-gray-500">ID: {detail.maChiTietSanPhamCu}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="font-medium">{describeVariant(detail.variantMoi, detail.maChiTietSanPhamMoi)}</div>
                        <div className="text-xs text-gray-500">ID: {detail.maChiTietSanPhamMoi}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                          {detail.soLuong || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{detail.lyDo || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          {ev?.imageEvidence && (
                            <a
                              href={ev.imageEvidence}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                            >
                              <ImageIcon size={12} />
                              Ảnh
                            </a>
                          )}
                          {ev?.videoEvidence && (
                            <a
                              href={ev.videoEvidence}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                            >
                              <Video size={12} />
                              Video
                            </a>
                          )}
                          {!ev?.imageEvidence && !ev?.videoEvidence && <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bảng minh chứng */}
        {attachments.length > 0 && (
          <div className="overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="bg-blue-600 px-6 py-3">
              <h2 className="text-lg font-bold text-white">Tài Liệu Minh Chứng</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {attachments.map((link, idx) => (
                  <a
                    key={`${link.url}-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border-2 border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-700 transition hover:border-blue-400 hover:bg-blue-100"
                  >
                    {link.label.includes('Video') ? <Video size={16} /> : <ImageIcon size={16} />}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bảng hướng dẫn */}
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="bg-blue-600 px-6 py-3">
            <h2 className="text-lg font-bold text-white">Hướng Dẫn Giao Nhận</h2>
          </div>
          <div className="border-t border-blue-100">
            <table className="w-full">
              <tbody className="divide-y divide-blue-100">
                <tr className="hover:bg-blue-50">
                  <td className="px-6 py-4 text-sm font-semibold text-blue-900 w-1/4">Địa chỉ gửi hàng cũ</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.diaChiGuiHangCu || '-'}</td>
                </tr>
                <tr className="hover:bg-blue-50">
                  <td className="px-6 py-4 text-sm font-semibold text-blue-900">Hướng dẫn đóng gói</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.huongDanDongGoi || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bảng Timeline */}
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="bg-blue-600 px-6 py-3">
            <h2 className="text-lg font-bold text-white">Lịch Sử Xử Lý</h2>
          </div>
          {logs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Chưa có lịch sử xử lý</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900">Hành động</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900">Từ trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900">Đến trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900">Người thực hiện</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {logs.map((log, idx) => {
                    const meta = getStatusMeta(log.to_status || log.toStatus || log.action);
                    const Icon = meta.icon;
                    return (
                      <tr key={log.id || idx} className="hover:bg-blue-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${meta.chip}`}>
                              <Icon className="h-4 w-4 text-white" />
                            </span>
                            <span className="text-sm font-medium text-gray-900">{log.action || meta.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.from_status || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full ${meta.chip} px-3 py-1 text-xs font-semibold text-white`}>
                            {log.to_status || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{getActorLabel(log)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(log.created_at || log.thoigian)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.note || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back Link */}
        <Link
          to="/doihang"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách
        </Link>
      </div>
    </div>
  );
}
