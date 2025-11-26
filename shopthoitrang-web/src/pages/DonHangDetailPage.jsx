import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCcw,
  PackageCheck,
  Wallet,
  DollarSign,
  ReceiptText,
  User2,
  MapPin,
} from 'lucide-react';
import donhangService from '../services/donhangService';

const formatTime = (ts) => {
  if (!ts) return '-';
  try {
    return new Date(ts).toLocaleString('vi-VN', { hour12: false });
  } catch (_) {
    return ts;
  }
};

const formatPrice = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value));
};

const SummaryCard = ({ icon: Icon, label, value, sub, accent = 'text-blue-600' }) => (
  <div className="rounded-3xl border border-gray-100 bg-white/90 p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 ${accent}`}>
        {Icon && <Icon size={18} />}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  </div>
);

const Section = ({ title, description, children }) => (
  <div className="rounded-3xl bg-white/95 shadow-lg ring-1 ring-black/5">
    <div className="border-b border-gray-100 px-6 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
    <div className="p-6 text-sm text-gray-700">{children}</div>
  </div>
);

export default function DonHangDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await donhangService.getById(id);
        setOrderDetail(data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Không thể tải chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  if (!orderDetail) {
    return <div className="p-8 text-center text-gray-500">Không tìm thấy đơn hàng</div>;
  }

  const products = Array.isArray(orderDetail.items) ? orderDetail.items : [];
  const subtotal =
    orderDetail.tongTienHang ??
    products.reduce((sum, it) => {
      const line = Number(it.thanhTien) || (Number(it.soLuong) || 0) * (Number(it.donGia) || 0);
      return sum + line;
    }, 0);
  const shipping = Number(orderDetail.phiVanChuyen || orderDetail.phiShip || 0);
  const discount = Number(orderDetail.giamGia || orderDetail.voucherValue || 0);
  const total = Number(orderDetail.thanhTien || subtotal + shipping - discount);

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="rounded-3xl bg-white/90 shadow-xl ring-1 ring-black/5">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Đơn hàng</p>
            <h1 className="text-3xl font-bold text-gray-900">#{orderDetail.maDonHang}</h1>
            <p className="text-sm text-gray-500">
              {orderDetail.ngayDatHang ? formatTime(orderDetail.ngayDatHang) : 'Không rõ thời gian đặt'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700">
              {orderDetail.trangThaiDonHang || 'Chưa xác định'}
            </span>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft size={14} /> Quay lại
            </button>
            <button
              onClick={() => navigate(0)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              <RefreshCcw size={14} /> Tải lại
            </button>
          </div>
        </div>
        <div className="grid gap-4 border-t border-gray-100 p-6 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={PackageCheck} label="Số sản phẩm" value={`${products.length} mặt hàng`} sub="Kiểm tra lại trước khi giao" />
          <SummaryCard
            icon={Wallet}
            label="Thanh toán"
            value={orderDetail.phuongThucThanhToan || '---'}
            sub={orderDetail.trangThaiThanhToan || 'Chưa cập nhật'}
            accent="text-emerald-600"
          />
          <SummaryCard
            icon={DollarSign}
            label="Tạm tính"
            value={formatPrice(subtotal)}
            sub={`Giảm giá: ${discount ? formatPrice(discount) : '0 đ'}`}
            accent="text-orange-600"
          />
          <SummaryCard
            icon={ReceiptText}
            label="Tổng thanh toán"
            value={formatPrice(total)}
            sub={`Phí vận chuyển: ${shipping ? formatPrice(shipping) : '0 đ'}`}
            accent="text-rose-600"
          />
        </div>
      </div>

      <Section title="Thông tin chung">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm">
          <div>
            <p className="text-xs uppercase text-gray-500">Mã đơn</p>
            <p className="font-semibold text-gray-900">{orderDetail.maDonHang}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Ngày đặt</p>
            <p className="font-semibold text-gray-900">{formatTime(orderDetail.ngayDatHang)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Trạng thái thanh toán</p>
            <p className="font-semibold text-gray-900">{orderDetail.trangThaiThanhToan || '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Ghi chú</p>
            <p className="font-semibold text-gray-900">{orderDetail.ghiChu || 'Không có'}</p>
          </div>
        </div>
      </Section>

      {(orderDetail.khachHang || orderDetail.diaChi) && (
        <Section title="Khách hàng & giao nhận">
          <div className="grid gap-6 md:grid-cols-2">
            {orderDetail.khachHang && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <User2 size={14} /> Khách hàng
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-400">Mã KH:</span> <span className="font-semibold">{orderDetail.khachHang.makhachhang || orderDetail.khachHang.maKH || orderDetail.maKhachHang || '-'}</span></p>
                  <p><span className="text-gray-400">Họ tên:</span> <span className="font-semibold">{orderDetail.khachHang.hoten || orderDetail.khachHang.ten || '-'}</span></p>
                  <p><span className="text-gray-400">Email:</span> <span className="font-semibold">{orderDetail.khachHang.email || '-'}</span></p>
                  <p><span className="text-gray-400">SĐT:</span> <span className="font-semibold">{orderDetail.khachHang.sodienthoai || orderDetail.khachHang.sdt || '-'}</span></p>
                </div>
              </div>
            )}

            {orderDetail.diaChi && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <MapPin size={14} /> Giao hàng
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-400">Người nhận:</span> <span className="font-semibold">{orderDetail.diaChi.ten || orderDetail.diaChi.nguoinhan || '-'}</span></p>
                  <p><span className="text-gray-400">SĐT:</span> <span className="font-semibold">{orderDetail.diaChi.sodienthoai || orderDetail.diaChi.sdt || '-'}</span></p>
                  <p><span className="text-gray-400">Phường/Xã:</span> <span className="font-semibold">{orderDetail.diaChi.phuong || orderDetail.diaChi.phuongxa || '-'}</span></p>
                  <p><span className="text-gray-400">Tỉnh/TP:</span> <span className="font-semibold">{orderDetail.diaChi.tinh || orderDetail.diaChi.tinhtp || '-'}</span></p>
                  <p><span className="text-gray-400">Địa chỉ chi tiết:</span> <span className="font-semibold">{orderDetail.diaChi.diachicuthe || orderDetail.diaChi.diachi || '-'}</span></p>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title="Sản phẩm" description="Danh sách các mặt hàng trong đơn">
        <div className="space-y-4">
          {products.length ? (
            products.map((it, idx) => {
              const lineAmount = Number(it.thanhTien) || (Number(it.soLuong) || 0) * (Number(it.donGia) || 0);
              return (
                <div key={idx} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start gap-4">
                    {it.imageUrl && <img src={it.imageUrl} alt={it.productName} className="h-20 w-20 rounded-2xl border object-cover" />}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{it.productName || 'Sản phẩm'}</p>
                          <p className="text-xs text-gray-500">Mã CTSP: {it.maChiTietSanPham || '--'}</p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-600">x{it.soLuong || 0}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        {it.variant?.color && <span>Màu: {it.variant.color}</span>}
                        {it.variant?.size && <span>Size: {it.variant.size}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between text-sm">
                    <span className="text-gray-500">Đơn giá: <strong className="text-gray-900">{it.donGia ? formatPrice(it.donGia) : '-'}</strong></span>
                    <span className="text-gray-500">Thành tiền: <strong className="text-rose-600">{formatPrice(lineAmount)}</strong></span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500">Không có sản phẩm nào trong đơn.</p>
          )}
        </div>
      </Section>

      <Section title="Thanh toán" description="Tổng kết phí và giảm giá áp dụng">
        <div className="flex flex-col items-end gap-2 text-sm">
          <div className="flex w-full max-w-md justify-between text-gray-500">
            <span>Tạm tính</span>
            <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex w-full max-w-md justify-between text-gray-500">
            <span>Phí vận chuyển</span>
            <span className="font-semibold text-gray-900">{formatPrice(shipping)}</span>
          </div>
          <div className="flex w-full max-w-md justify-between text-gray-500">
            <span>Giảm giá</span>
            <span className="font-semibold text-gray-900">- {formatPrice(discount)}</span>
          </div>
          <div className="mt-4 flex w-full max-w-md justify-between border-t border-dashed border-gray-200 pt-4 text-lg font-bold text-rose-600">
            <span>Tổng thanh toán</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </Section>
    </div>
  );
}
